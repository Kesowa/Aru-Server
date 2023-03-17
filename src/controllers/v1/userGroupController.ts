import { Request } from "express";
import Permission from "../../models/permission";
import { AuthResponse } from "../../utils/interfaceUtils";
import User from "../../models/user";
import UserGroup from "../../models/usergroup";
import Tenant from "../../models/tenant";
import { IPermission } from "../../schemas/permission";
import { sanitizeSort } from "../../utils/requestHelpers";
import { IUserGroup } from "../../schemas/usergroup";

//create new  permission
export const createUserGroupforTenant = async (
  req: Request,
  res: AuthResponse
) => {
  {
    const [existing_group, permissions] = await Promise.all([
      UserGroup.findOne({
        name: req.body.name,
        tenantId: res.locals.user.tenantId._id,
      }),
      Permission.find({
        _id: { $in: req.body.permissions },
        isVisibleToTenant: true,
      }),
    ]);
    if (existing_group) {
      res.json({
        status: false,
        message: "Duplicate group name.",
      });
    } else {
      const permission_ids = permissions.map((ele) => ele._id);
      const user_group = new UserGroup({
        name: req.body.name,
        permissions: permission_ids,
        tenantId: res.locals.user.tenantId._id,
        createdBy: res.locals.user._id,
        updatedBy: res.locals.user._id,
        isActive: true,
      });
      const ug = await user_group.save();
      const tenant: any = await Tenant.findOne({
        _id: res.locals.user.tenantId,
      });
      if (ug && tenant.actualUserGroupCount >= 0) {
        await Tenant.updateOne(
          { _id: res.locals.user.tenantId },
          { $inc: { actualUserGroupCount: 1 } }
        );
        // tenant.actualUserGroupCount = Number(tenant.actualUserGroupCount) + 1;
        // await tenant.save();
      }
      res.status(201).json({
        status: true,
        message: "User Group created sucessfully",
      });
    }
  }
};

//List User Group
export const listUserGroupforTenant = async (
  req: Request<{}, {}, {}, { sort: string }>,
  res: AuthResponse
) => {
  {
    const [sortBy, order] = (req.query.sort || "name:desc").split(":");
    const user_groups = await UserGroup.find({
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ permissions: IPermission }>("permissions", "name isClient")
      .collation({ locale: "en" })
      .sort({ [sortBy]: sanitizeSort(order) });
    return res.json({
      status: true,
      message: "user groups fetched",
      data: user_groups,
    });
  }
};

// Get User Group by ID
export const getUserGroupbyID = async (req: Request, res: AuthResponse) => {
  {
    const userGroupID = req.query.id;
    const user_group = await UserGroup.find({
      _id: userGroupID,
      tenantId: res.locals.user.tenantId._id,
    })
      .populate<{ usergroups: IUserGroup }>("name", "permissions")
      .exec();
    res.json({
      status: true,
      message: "user group fetched",
      data: user_group,
    });
  }
};

export const UserGroupforEdit = async (req: Request, res: AuthResponse) => {
  {
    const data = await UserGroup.findOne({
      _id: req.body.id,
      tenantId: res.locals.user.tenantId,
    });
    if (data) {
      const doc = await UserGroup.findOneAndUpdate(
        { _id: req.body.id, tenantId: res.locals.user.tenantId },
        req.body,
        {
          new: true,
          upsert: true,
          useFindAndModify: false,
        }
      );
      return res.status(200).json({
        status: true,
        message: "User group successfully updated!",
        data: doc,
      });
    } else
      return res.status(400).json({
        status: false,
        message: "User group does not match!",
      });
  }
};

export const UserGroupDelete = async (req: Request, res: AuthResponse) => {
  {
    const data = await User.findOne({
      userGroupId: req.query.id,
      tenantId: res.locals.user.tenantId,
    });
    if (!data) {
      const dd = await UserGroup.findOne({
        _id: req.query.id,
        tenantId: res.locals.user.tenantId,
      });
      if (dd) {
        const d = await UserGroup.findOneAndDelete({
          _id: req.query.id,
          tenantId: res.locals.user.tenantId,
        });
        const tenant: any = await Tenant.findOne({
          _id: res.locals.user.tenantId,
        });
        if (d && tenant.actualUserGroupCount) {
          await Tenant.updateOne(
            { _id: res.locals.user.tenantId },
            { $inc: { actualUserGroupCount: -1 } }
          );
          // tenant.actualUserGroupCount = Number(tenant.actualUserGroupCount) - 1;
          // await tenant.save();
        }
        return res.status(200).json({
          status: true,
          message: "User Group deleted successfully!",
        });
      } else {
        return res.status(200).json({
          status: false,
          message: "User Group does not exist",
        });
      }
    } else
      return res.status(400).json({
        status: false,
        message: "User group cannot be deleted since it is already in use",
      });
  }
};
