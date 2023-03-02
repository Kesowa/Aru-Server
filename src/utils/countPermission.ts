import Tenant from "../models/tenant";
import { NextFunction, Request } from "express";
import { AuthResponse } from "./interfaceUtils";
export const isAlertCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualAlertCount) <
      Number(docCount.activePackage.alertCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message: "Actual alertCount exceeded the Limit of Set alertCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isUserCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualUserCount) <
      Number(docCount.activePackage.userCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message: "Actual userCount exceeded the Limit of Set userCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isClientCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualClientCount) <
      Number(docCount.activePackage.clientCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message: "Actual clientCount exceeded the Limit of Set clientCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isMissionCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualMissionCount) <
      Number(docCount.activePackage.missionCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message: "Actual missionCount exceeded the Limit of Set missionCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isLayerCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const doc: any = await Tenant.findOne({ _id: res.locals.user.tenantId })
      .populate("activePackage")
      .lean();
    if (Number(doc.actualLayerCount) < Number(doc.activePackage.layerCount))
      return next();
    else
      return res.status(403).json({
        status: false,
        message: "Actual layerCount exceeded the Limit of Set layerCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isLocationCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualLocationCount) <
      Number(docCount.activePackage.locationCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message:
          "Actual locationCount exceeded the Limit of Set locationCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isVodCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualVodCount) < Number(docCount.activePackage.vodCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message: "Actual vodCount exceeded the Limit of Set vodCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};

export const isUserGroupCount = async (
  req: Request,
  res: AuthResponse,
  next: NextFunction
) => {
  try {
    const docCount: any = await Tenant.findOne({
      _id: res.locals.user.tenantId,
    })
      .populate("activePackage")
      .lean();
    if (
      Number(docCount.actualUserGroupCount) <
      Number(docCount.activePackage.userGroupCount)
    )
      return next();
    else
      return res.status(403).json({
        status: false,
        message:
          "Actual userGroupCount exceeded the Limit of Set userGroupCount!",
      });
  } catch (error) {
    res.locals.logger.error(error);
    res.status(500).json({
      status: false,
      message: "Server Error!",
    });
  }
};
