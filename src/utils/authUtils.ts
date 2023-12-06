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
      } else if (data == InvalidAuth.INVALID_LOCATION) {
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
  perm: Array<
    | {
        permName: "name";
        value: string;
      }
    | {
        permName: string;
        value: boolean;
      }
  >;
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
    if (perm.perm.length > 0 && !authorized) {
      let anyPerms = false; // we initialize authorized with true and if ANY of the perms is not found in user.customPermissions, we make it false and break the loop
      for (const permission of perm.perm) {
        const found = res.locals.user.customPermissions.findIndex(
          (userPerm) => {
            if (userPerm[permission.permName] === permission.value) {
              return true;
            }
            return false;
          }
        );
        if (found !== -1) {
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
  perm: [{ permName: "isPilot", value: true }],
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
  perm: [{ permName: "name", value: "edit_client" }],
});
// Mission Management Permissions:
export const canCreateMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "mission_create" },
    { permName: "isPilot", value: true },
  ],
});
export const canUpdateMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "mission_update" }],
});
export const canDeleteMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "mission_delete" }],
});
export const canListMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "mission_list" },
    // { permName: "name", value: "mission_create" },
    // { permName: "name", value: "data_page" },
    // { permName: "name", value: "client_data" },
  ],
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
  perm: [{ permName: "name", value: "asset_create" }],
});
export const canUpdateAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "asset_update" }],
});
export const canDeleteAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "asset_delete" }],
});
export const canListAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "asset_list" },
    // { permName: "name", value: "mission_create" },
    // { permName: "name", value: "asset_create" },
  ],
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
  perm: [{ permName: "name", value: "asset_class_list" }],
});

//FlightLog Apis
export const canListFlightLogs = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "flight_log_list" }],
});

//User Management Permission:
export const canListUsers = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "user_list" },
    // { permName: "name", value: "asset_create" },
  ],
});

//Location Management Permissions :
export const canCreateLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "location_create" }],
});
export const canUpdateLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "location_update" }],
});
export const canDeleteLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "location_delete" }],
});
export const canListLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "location_list" },
    // { permName: "name", value: "mission_create" },
    // { permName: "name", value: "data_page" },
  ],
});

//Manufacturer Management Permissions :
export const canCreateManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "manufacturer_create" }],
});
export const canUpdateManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "manufacturer_update" }],
});
export const canDeleteManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "manufacturer_delete" }],
});
export const canListManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "manufacturer_list" },
    // { permName: "name", value: "model_create" },
    // { permName: "name", value: "asset_create" },
  ],
});

//Model Management Permissions :
export const canCreateModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "model_create" }],
});
export const canUpdateModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "model_update" }],
});
export const canDeleteModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "model_delete" }],
});
export const canListModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "model_list" },
    // { permName: "name", value: "asset_create" },
  ],
});

//Thread Management Permissions :
export const canCreateThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "thread_create" }],
});
export const canUpdateThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "thread_update" }],
});
export const canDeleteComment = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "comment_delete" }],
});
export const canListThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "thread_list" }],
});

//VOD Management Permissions :
export const canCreateVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "vod_create" }],
});
export const canUpdateVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "vod_update" }],
});
export const canDeleteVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "vod_delete" }],
});
export const canListVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "vod_list" },
    // { permName: "name", value: "mission_list" },
    // { permName: "name", value: "data_page" },
    // { permName: "name", value: "client_data" },
    // { permName: "isClient", value: true },
  ],
});

//Alert Management Permissions :
export const canCreateAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "alert_create" },
    { permName: "isPilot", value: true },
  ],
});
export const canUpdateAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "alert_update" }],
});
export const canDeleteAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "alert_delete" }],
});
export const canListAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "alert_list" },
    { permName: "name", value: "mission_list" },
    { permName: "name", value: "data_page" },
  ],
});

//Pilot Management Permissions

export const canListPilots = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "mission_list" }],
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
  perm: [{ permName: "name", value: "Feature_File_upload" }],
});
export const candeleteFilefromGEOJSON = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "Feature_File_Delete" }],
});
export const canSetCoverPhoto = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "set_cover_photo" }],
});

export const canAutoAssignImage = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "isClient", value: true }],
});

//------------Feature related perms--------------------------------
export const caneditGEOJSON = genPermissionGuard({
  //Change color is also included in this, because change feature color is the same as edit feature
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "edit_feature" }],
});
export const canDeleteFeature = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "delete_feature" }],
});
export const canaddFeature = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "add_feature" }],
});

//--------------Layer Related---------------------------
export const canCreateLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "upload_layer" }],
});
export const canDeleteLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "delete_layer" }],
});
export const canEditLayer = genPermissionGuard({
  //perm gaurd to be used in both edit layer and change color of layer api
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "edit_layer" }],
});
export const canCreateVectorLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "save_drawings" }],
});
export const canDownloadLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "download_layer" }],
});

// ----------------BaseMap Permissions-----------------------------
export const canCreateBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    {
      permName: "name",
      value: "canCreateBaseLayer",
    },
  ],
});

export const canUpdateBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    {
      permName: "name",
      value: "canUpdateBaseLayer",
    },
  ],
});

export const canDeleteBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    {
      permName: "name",
      value: "canDeleteBaseLayer",
    },
  ],
});

export const canEditBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    {
      permName: "name",
      value: "canEditBaseLayer",
    },
  ],
});

export const canUploadToBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    {
      permName: "name",
      value: "canUploadToBaseLayer",
    },
  ],
});

//-----------------Document permissions----------------------------
export const canUploadDocument = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "upload_document" }],
});
export const canDeleteDocument = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "delete_document" }],
});

//---------Client Perms----------------------
export const canClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "isClient", value: true }],
});

export const canCreateClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "create_client" },
    { permName: "name", value: "client_list" },
  ],
});

export const canEditClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "edit_client" }],
});

export const canDeleteClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "delete_client" }],
});

export const canListClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [{ permName: "name", value: "client_list" }],
});

export const canManageClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "create_client" },
    { permName: "name", value: "edit_client" },
    { permName: "name", value: "delete_client" },
  ],
});

export const canViewRTCstream = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [
    { permName: "name", value: "webrtc_view" },
    { permName: "name", value: "mission_list" },
  ],
});
