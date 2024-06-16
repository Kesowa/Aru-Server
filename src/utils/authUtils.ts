import { Request, NextFunction, Response } from "express";
import User from "../models/user";
import { AuthResponse } from "./interfaceUtils";
import UserGroup from "../models/usergroup";
import Tenant from "../models/tenant";
import { sessionModel } from "../models/session";

import { IPackage } from "../schemas/package";
import PassReset from "../models/passwordReset";
import crypto from "crypto";
import { MODE, Mode, SECRET_KEY } from "../constants";
import { ObjectId } from "mongodb";
import { permissions } from "./permissions";
import { IPermission } from "../schemas/permission";

enum InvalidAuth {
  PACKAGE_EXPIRED,
  INVALID_USER,
  INVALID_LOCATION,
  INVALID_AGENT,
}

const hasher = crypto.createHash("MD5");
hasher.update("somerandomkey", "utf8");
export const iv = hasher.digest();

type Payload = {
  session: string;
  ip: string;
  agent: string;
};

export const tokenEncoder = (payload: Payload) => {
  const cipher = crypto.createCipheriv(
    "aes192",
    Buffer.from(SECRET_KEY, "base64"),
    iv
  );
  let encrypted = cipher.update(JSON.stringify(payload), "utf8", "base64");
  encrypted += cipher.final("base64");
  return encrypted;
};

const tokenDecoder = (token: string) => {
  const decipher = crypto.createDecipheriv(
    "aes192",
    Buffer.from(SECRET_KEY, "base64"),
    iv
  );
  try {
    let decrypted = decipher.update(token, "base64", "utf8");
    decrypted += decipher.final("utf8");
    const payload = JSON.parse(decrypted) as Payload;
    return payload;
  } catch {
    return { session: null, ip: null, agent: null };
  }
};

const Authenticator = async (token: string, ip: string, agent: string) => {
  const payload = tokenDecoder(token);
  if (MODE == Mode.Prod) {
    if (payload.ip != ip) return InvalidAuth.INVALID_LOCATION;
    if (payload.agent != agent) return InvalidAuth.INVALID_AGENT;
  }
  const session = await sessionModel.findById(new ObjectId(payload.session));
  const user = await User.findById(session?.owner).populate("tenantId").lean();

  if (user && session) {
    if (user.userGroupId) {
      const userGroup = await UserGroup.findById(user.userGroupId).populate(
        "permissions"
      );
      user.customPermissions = Array.from(userGroup?.permissions || []);
    }
    if (user.userType == "super-admin") return user;
    const doc = await Tenant.findOne({ _id: user.tenantId }).populate<{
      activePackage: IPackage;
    }>("activePackage");
    // doc.actualSize = new Types.Decimal128("0");
    // await doc.save();
    const date1 = new Date(doc.packageStartDate);
    const date2 = new Date(Date.now());
    const oneDay = 1000 * 60 * 60 * 24;
    const diffInTime = date2.getTime() - date1.getTime();
    const diffInDays = Math.round(diffInTime / oneDay);
    if (Number(doc.activePackage.duration) >= Number(diffInDays)) return user;
    else return InvalidAuth.PACKAGE_EXPIRED;
  } else {
    return InvalidAuth.INVALID_USER;
  }
};

export const isAuthenticated = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(400).json({
      status: false,
      message: "request validation failed",
      data: {
        headers: {
          authorization: "bearer token not set or invalid",
        },
      },
    });
    return;
  }
  Authenticator(token, req.ip, req.headers["user-agent"])
    .then((data) => {
      if (data == InvalidAuth.PACKAGE_EXPIRED) {
        res.status(401).json({
          status: false,
          message: "package expired",
        });
      } else if (data == InvalidAuth.INVALID_USER) {
        res.status(401).json({
          status: false,
          message: "Invalid user id",
        });
      } else if (data == InvalidAuth.INVALID_LOCATION && MODE != Mode.Dev) {
        res.status(401).json({
          status: false,
          message: "Location not authorized",
        });
      } else if (data == InvalidAuth.INVALID_AGENT) {
        res.status(401).json({
          status: false,
          message: "Agent not authorized",
        });
      } else {
        res.locals["user"] = data;
        next();
      }
    })
    .catch((err) => {
      req.log.error(err);
      res.status(500).json({
        status: false,
        message: "server error",
      });
    });
};

type permGuardType = {
  userTypes: Array<string>;
  userGroups?: Array<string>;
  perm: Array<permissions>;
};

function genPermissionGuard(perm: permGuardType) {
  return (req: Request, res: AuthResponse, next: NextFunction) => {
    let authorized = false;
    if (perm.userTypes.length > 0) {
      if (perm.userTypes.includes(res.locals.user.userType)) {
        authorized = true;
        req.log.info("User type authorized!");
      } else {
        authorized = false;
      }
    }
    if (perm.userGroups && perm.userGroups.length > 0 && !authorized) {
      if (perm.userGroups.includes(res.locals.user.userGroupId.toString())) {
        authorized = true;
        req.log.info("User group authorized!");
      } else {
        authorized = false;
      }
    }
    if (perm.perm.length > 0 && !authorized) {
      let anyPerms = false; // we initialize authorized with true and if ANY of the perms is not found in user.customPermissions, we make it false and break the loop
      for (const permission of perm.perm) {
        const found = res.locals.user.customPermissions.map(p => p.name).includes(permission);
        if (found) {
          req.log.info("Permission found!", permission);
          anyPerms = true;
          break;
        }
      }
      authorized = anyPerms;
    }
    if (authorized) {
      next();
    } else {
      res.status(403).json({
        status: false,
        message: "Permission denied",
      });
    }
  };
}

export const shouldLinkSend = async (
  req: Request<{}, {}, { email: string }>,
  res: Response,
  next: NextFunction
) => {
  try {
    const email = req.body.email;
    const isSent = await PassReset.findOne({ email });

    if (isSent && isSent.retries >= 5) {
      throw new Error("You have reached the daily limit to change password");
    } else {
      if (isSent) {
        throw new Error("Email already sent! Please check your email");
      }
    }

    next();
  } catch (error: unknown) {
    res.json({
      status: false,
      message: "Server error",
    });
  }
};

export const canFly = genPermissionGuard({
  userTypes: ["tenant-root"],
  userGroups: ["6034c331a2f9c7554b1d42e0"],
  perm: [],
});

export const onlySuperAdminAccess = genPermissionGuard({
  userTypes: ["super-admin"],
  perm: [],
});
export const onlyTenantRootAccess = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [],
});

export const canListUserGroup = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.EDIT_CLIENT],
});
// Mission Management Permissions:
export const canCreateMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  userGroups: ["6034c331a2f9c7554b1d42e0"],
  perm: [permissions.MISSION_CREATE],
});
export const canUpdateMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MISSION_UPDATE],
});
export const canDeleteMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MISSION_DELETE],
});
export const canListMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MISSION_LIST],
});

// Flight Management Permissions:
// export const canCreateFlight = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "flight_create" }],
// });
// export const canUpdateFlight = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "flight_update" }],
// });
// export const canDeleteFlight = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "flight_delete" }],
// });
// export const canListFlight = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "flight_list" }],
// });

//Asset Management Permissions :
export const canCreateAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ASSET_CREATE],
});
export const canUpdateAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ASSET_UPDATE],
});
export const canDeleteAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ASSET_DELETE],
});
export const canListAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ASSET_LIST],
});

//Asset Class Management Permissions :
// export const canCreateAssetClass = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "asset_class_create" }],
// });
// export const canUpdateAssetClass = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "asset_class_update" }],
// });
// export const canDeleteAssetClass = genPermissionGuard({
//   userTypes: ["tenant-root"],
//   perm: [{ permName: "name", value: "asset_class_delete" }],
// });

export const canListAssetClass = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ASSET_CLASS_LIST],
});

//FlightLog Apis
export const canListFlightLogs = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.FLIGHT_LOG_LIST],
});

//User Management Permission:
export const canListUsers = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.USER_LIST],
});

//Location Management Permissions :
export const canCreateLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.LOCATION_CREATE],
});
export const canUpdateLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.LOCATION_UPDATE],
});
export const canDeleteLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.LOCATION_DELETE],
});
export const canListLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.LOCATION_LIST],
});

//Manufacturer Management Permissions :
export const canCreateManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MANUFACTURER_CREATE],
});
export const canUpdateManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MANUFACTURER_UPDATE],
});
export const canDeleteManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MANUFACTURER_DELETE],
});
export const canListManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MANUFACTURER_LIST],
});

//Model Management Permissions :
export const canCreateModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MODEL_CREATE],
});
export const canUpdateModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MODEL_UPDATE],
});
export const canDeleteModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MODEL_DELETE],
});
export const canListModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MODEL_LIST],
});

//Thread Management Permissions :
export const canCreateThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.THREAD_CREATE],
});
export const canUpdateThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.THREAD_UPDATE],
});
export const canDeleteComment = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.COMMENT_DELETE],
});
export const canListThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.THREAD_LIST],
});

//VOD Management Permissions :
export const canCreateVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.VOD_CREATE],
});
export const canUpdateVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.VOD_UPDATE],
});
export const canDeleteVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.VOD_DELETE],
});
export const canListVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.VOD_LIST],
});

//Alert Management Permissions :
export const canCreateAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  userGroups: ["6034c331a2f9c7554b1d42e0"],
  perm: [permissions.ALERT_CREATE],
});
export const canUpdateAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ALERT_UPDATE],
});
export const canDeleteAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ALERT_DELETE],
});
export const canListAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    permissions.ALERT_LIST,
    permissions.MISSION_LIST,
    permissions.DATA_PAGE,
  ],
});

//Pilot Management Permissions

export const canListPilots = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.MISSION_LIST],
});

//Mapping Management Permissions

// export const canListMappingMissions = genPermissionGuard({ //----------------needs further discussion
//   userTypes:["tenant-root"],
//   perm : [
//     { permName: "name", value: "mapMission_list"},
//     { permName: "name", value: "mission_list" },
//     { permName: "name", value : "data_page"}
//   ],
// });

// export const canCreateMappingMission = genPermissionGuard({ //--------------needs discussion
//   userTypes:["tenant-root"],
//   perm : [
//     { permName : "name", value: "mapMission_create"},
//     { permName: "name", value: "mapMission_edit"},
//     { permName: "name", value: "mapMission_changeColor"},
//     {permName: "name", value: "mapMission_addFeature"},
//     {permName: "name", value: "mapMission_editGEOJSON"}
//   ]
// });

// export const canDeleteMappingMission = genPermissionGuard({ //-----------------needs discussion
//   perm : [
//     { permName:"name", value: "mapMission_delete"}
//   ]
// });

// export const canUploadFiletoLayer = genPermissionGuard({ //---------to be used later
//   userTypes: ["tenant_root"],
//   perm: [
//     {permName : "name" , value: "canUploadFile_layer"}
//   ]
// });

//---------------------Feature File upload perms----------
export const canUploadFiletoGEOJSON = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.FEATURE_FILE_UPLOAD],
});
export const candeleteFilefromGEOJSON = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.FEATURE_FILE_DELETE],
});
export const canSetCoverPhoto = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.SET_COVER_PHOTO],
});

export const canAutoAssignImage = genPermissionGuard({
  userTypes: ["tenant-root", "tenant-client"],
  perm: [],
});

//------------Feature related perms--------------------------------
export const caneditGEOJSON = genPermissionGuard({
  //Change color is also included in this, because change feature color is the same as edit feature
  userTypes: ["tenant-root"],
  perm: [permissions.EDIT_FEATURE],
});
export const canDeleteFeature = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.DELETE_FEATURE],
});
export const canaddFeature = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.ADD_FEATURE],
});

//--------------Layer Related---------------------------
export const canCreateLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.UPLOAD_LAYER],
});
export const canDeleteLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.DELETE_LAYER],
});
export const canEditLayer = genPermissionGuard({
  //perm gaurd to be used in both edit layer and change color of layer api
  userTypes: ["tenant-root"],
  perm: [permissions.EDIT_LAYER],
});
export const canCreateVectorLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.SAVE_DRAWINGS],
});
export const canDownloadLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.DOWNLOAD_LAYER],
});

// ----------------BaseMap Permissions-----------------------------
export const canCreateBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.CAN_CREATE_BASE_LAYER],
});

export const canUpdateBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.CAN_UPDATE_BASE_LAYER],
});

export const canDeleteBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.CAN_DELETE_BASE_LAYER],
});

export const canEditBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.CAN_EDIT_BASE_LAYER],
});

export const canUploadToBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.CAN_UPLOAD_TO_BASE_LAYER],
});

//-----------------Document permissions----------------------------
export const canUploadDocument = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.UPLOAD_DOCUMENT],
});
export const canDeleteDocument = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.DELETE_DOCUMENT],
});

//---------Client Perms----------------------
export const canClient = genPermissionGuard({
  userTypes: ["tenant-root", "tenant-client"],
  perm: [],
});

export const canCreateClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    permissions.CREATE_CLIENT,
    permissions.CLIENT_LIST,
  ],
});

export const canEditClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.EDIT_CLIENT],
});

export const canDeleteClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.DELETE_CLIENT],
});

export const canListClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [permissions.CLIENT_LIST],
});

export const canManageClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    permissions.CREATE_CLIENT,
    permissions.EDIT_CLIENT,
    permissions.DELETE_CLIENT,
  ],
});

export const canViewRTCstream = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    permissions.WEBRTC_VIEW,
    permissions.MISSION_LIST,
  ],
});
