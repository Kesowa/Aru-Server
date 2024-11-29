import { Request, NextFunction, Response } from "express";
import User from "../models/user";
import { AuthResponse } from "./interfaceUtils";
import Tenant from "../models/tenant";

import { IPackage } from "../schemas/package";
import PassReset from "../models/passwordReset";
import { GetPermissions, PERMS } from "../schemas/permission";
import { Session } from "express-session";
import zod from "zod";

enum InvalidAuth {
  PACKAGE_EXPIRED,
  INVALID_USER,
  INVALID_LOCATION,
  INVALID_AGENT,
}

const UserSession = zod.object({
  id: zod.string(),
  email: zod.string(),
  tenant: zod.string(),
});

const Authenticator = async (session: Session) => {
  const sessionData = UserSession.safeParse(session["user"]);
  if (!sessionData.success) {
    return InvalidAuth.INVALID_USER;
  }
  const { id, email, tenant, } = sessionData.data;
  const user = await User.findById(id).populate("tenantId").lean();

  if (user) {
    user["customPermissions"] = await GetPermissions(
      user.userGroupId,
      user.userType,
      user.tenantId
    );
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
  Authenticator(req.session)
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
  perm: Array<PERMS>;
};

export function PermissionGuard(...perms: PERMS[]) {
  return (req: Request, res: AuthResponse, next: NextFunction) => {
    console.log("PERMISSIONS", perms);
    const sufficientPerms = perms.every((perm) =>
      res.locals.user.customPermissions.includes(perm)
    );
    if (sufficientPerms) {
      req.log.info("user has sufficient perms");
      next();
      return;
    }
    const missingPerms = perms.filter(
      (perm) => !res.locals.user.customPermissions.includes(perm)
    );
    res.status(403).json({
      status: false,
      message: "Permission denied",
      data: missingPerms,
    });
  };
}

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
        const found = res.locals.user.customPermissions.includes(permission);
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
  perm: [PERMS.EDIT_CLIENT],
});
// Mission Management Permissions:
export const canCreateMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  userGroups: ["6034c331a2f9c7554b1d42e0"],
  perm: [PERMS.MISSION_CREATE],
});
export const canUpdateMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MISSION_UPDATE],
});
export const canDeleteMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MISSION_DELETE],
});
export const canListMission = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MISSION_LIST],
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
  perm: [PERMS.ASSET_CREATE],
});
export const canUpdateAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ASSET_UPDATE],
});
export const canDeleteAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ASSET_DELETE],
});
export const canListAsset = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ASSET_LIST],
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
  perm: [PERMS.ASSET_CLASS_LIST],
});

//FlightLog Apis
export const canListFlightLogs = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.FLIGHT_LOG_LIST],
});

//User Management Permission:
export const canListUsers = genPermissionGuard({
  userTypes: ["tenant-root", "tenant-staff"],
  perm: [PERMS.USER_LIST],
});

//Location Management Permissions :
export const canCreateLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.LOCATION_CREATE],
});
export const canUpdateLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.LOCATION_UPDATE],
});
export const canDeleteLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.LOCATION_DELETE],
});
export const canListLocation = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.LOCATION_LIST],
});

//Manufacturer Management Permissions :
export const canCreateManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MANUFACTURER_CREATE],
});
export const canUpdateManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MANUFACTURER_UPDATE],
});
export const canDeleteManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MANUFACTURER_DELETE],
});
export const canListManufacturer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MANUFACTURER_LIST],
});

//Model Management Permissions :
export const canCreateModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MODEL_CREATE],
});
export const canUpdateModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MODEL_UPDATE],
});
export const canDeleteModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MODEL_DELETE],
});
export const canListModel = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MODEL_LIST],
});

//Thread Management Permissions :
export const canCreateThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.THREAD_CREATE],
});
export const canUpdateThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.THREAD_UPDATE],
});
export const canDeleteComment = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.COMMENT_DELETE],
});
export const canListThread = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.THREAD_LIST],
});

//VOD Management Permissions :
export const canCreateVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.VOD_CREATE],
});
export const canUpdateVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.VOD_UPDATE],
});
export const canDeleteVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.VOD_DELETE],
});
export const canListVOD = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.VOD_LIST],
});

//Alert Management Permissions :
export const canCreateAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  userGroups: ["6034c331a2f9c7554b1d42e0"],
  perm: [PERMS.ALERT_CREATE],
});
export const canUpdateAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ALERT_UPDATE],
});
export const canDeleteAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ALERT_DELETE],
});
export const canListAlert = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ALERT_LIST, PERMS.MISSION_LIST, PERMS.DATA_PAGE],
});

//Pilot Management Permissions

export const canListPilots = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.MISSION_LIST],
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
  perm: [PERMS.FEATURE_FILE_UPLOAD],
});
export const candeleteFilefromGEOJSON = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.FEATURE_FILE_DELETE],
});
export const canSetCoverPhoto = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.SET_COVER_PHOTO],
});

export const canAutoAssignImage = genPermissionGuard({
  userTypes: ["tenant-root", "tenant-client"],
  perm: [],
});

//------------Feature related perms--------------------------------
export const caneditGEOJSON = genPermissionGuard({
  //Change color is also included in this, because change feature color is the same as edit feature
  userTypes: ["tenant-root"],
  perm: [PERMS.EDIT_FEATURE],
});
export const canDeleteFeature = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.DELETE_FEATURE],
});
export const canaddFeature = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.ADD_FEATURE],
});

//--------------Layer Related---------------------------
export const canCreateLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.UPLOAD_LAYER],
});
export const canDeleteLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.DELETE_LAYER],
});
export const canEditLayer = genPermissionGuard({
  //perm gaurd to be used in both edit layer and change color of layer api
  userTypes: ["tenant-root"],
  perm: [PERMS.EDIT_LAYER],
});
export const canCreateVectorLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.UPLOAD_LAYER],
});
export const canDownloadLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.DOWNLOAD_LAYER],
});

// ----------------BaseMap Permissions-----------------------------
export const canCreateBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CAN_CREATE_BASE_LAYER],
});

export const canUpdateBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CAN_UPDATE_BASE_LAYER],
});

export const canDeleteBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CAN_DELETE_BASE_LAYER],
});

export const canEditBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CAN_EDIT_BASE_LAYER],
});

export const canUploadToBaseLayer = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CAN_UPLOAD_TO_BASE_LAYER],
});

//-----------------Document permissions----------------------------
export const canUploadDocument = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.UPLOAD_DOCUMENT],
});
export const canDeleteDocument = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.DELETE_DOCUMENT],
});

//---------Client Perms----------------------
export const canClient = genPermissionGuard({
  userTypes: ["tenant-root", "tenant-client"],
  perm: [],
});

export const canCreateClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CREATE_CLIENT, PERMS.CLIENT_LIST],
});

export const canEditClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.EDIT_CLIENT],
});

export const canDeleteClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.DELETE_CLIENT],
});

export const canListClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CLIENT_LIST],
});

export const canManageClient = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.CREATE_CLIENT, PERMS.EDIT_CLIENT, PERMS.DELETE_CLIENT],
});

export const canViewRTCstream = genPermissionGuard({
  userTypes: ["tenant-root"],
  perm: [PERMS.WEBRTC_VIEW, PERMS.MISSION_LIST],
});
