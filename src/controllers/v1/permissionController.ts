import { Request } from "express";
import { formatRequestError } from "../../utils/errorFormaterUtils";
import Permission from "../../models/permission";
import { AuthResponse } from "../../utils/interfaceUtils";
import { IUser } from "../../schemas/user";

//create new  permission
export const createPermission = async (req: Request, res: AuthResponse) => {
  {
    const existingPermission = await Permission.findOne({
      name: req.body.name,
    });
    if (!existingPermission) {
      const permission = new Permission({
        name: req.body.name,
        isFrontendRoute: req.body.isFrontendRoute,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        isVisibleToTenant: req.body.isVisibleToTenant,
        isVisibleToSuperAdmin: req.body.isVisibleToSuperAdmin,
        isPilot: req.body.isPilot,
      });
      if (permission.isFrontendRoute) {
        permission.frontendRoute = req.body.frontendRoute;
        permission.sideNavOptionIcon = req.body.sideNavOptionIcon;
        permission.sideNavOptionLabel = req.body.sideNavOptionLabel;
        permission.isSideNavOption = req.body.isSideNavOption;
      }
      const perm = await permission.save();
      res.status(201).json({
        status: true,
        message: "permission created sucessfully",
      });
    } else {
      res.status(400).json({
        status: false,
        message: "A permission with this name already exist.",
      });
    }
  }
};

//fetch all permissions
export const fetchAllPermissions = async (req: Request, res: AuthResponse) => {
  {
    const permissions = await Permission.find({})
      .populate<{ createdBy: IUser }>("createdBy", "name")
      .exec();
    res.json({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: permissions,
    });
  }
};

//fetch tenant permissions
export const fetchTenantPermissions = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const permissions = await Permission.find({ isVisibleToTenant: true });
    res.json({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: permissions,
    });
  }
};

//mod isClient perms
// REVISIT: This is likely just for development

export const modisClient = async (req: Request, res: AuthResponse) => {
  {
    const docs = await Permission.find({});
    if (docs.length) {
      for (let i = 0; i < docs.length; i++) {
        docs[i].isClient = req.body.isClient;
        docs[i].save();
      }
      //let savedDoc= await docs.save();
      if (1) {
        res.json({
          status: true,
          message: `All perms has been modified to isClient=${req.body.isClient}`,
        });
      } else {
        res.json({
          status: false,
          message: "Could not modify data",
        });
      }
    } else {
      res.json({
        status: false,
        message: "Data does not exist",
      });
    }
  }
};
