import { Request } from "express";
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
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
      });
      await permission.save();
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
