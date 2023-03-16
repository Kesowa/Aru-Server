import { Request } from "express";
import User from "../../models/user";
import { AuthResponse } from "../../utils/interfaceUtils";
import { IPermission } from "../../schemas/permission";

// Create Alert Controlller
export const getAllPilots = async (req: Request, res: AuthResponse) => {
  {
    const users = await User.find({
      tenantId: res.locals.user.tenantId._id,
      userGroupId: { $exists: true },
    }).populate<{ userGroupId: { permissions: IPermission[] } }>({
      path: "userGroupId",
      select: "permissions",
      populate: {
        path: "permissions",
        select: "isPilot",
        match: { isPilot: true },
      },
    });
    return res.json({
      status: true,
      message: `pilot ${users.length} data fetched successfully`,
      data: users,
    });
  }
};
