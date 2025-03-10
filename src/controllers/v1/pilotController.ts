import { Request } from "express";

import User from "../../models/user";
import UserGroup from "../../models/usergroup";
import { AuthResponse } from "../../utils/interfaceUtils";

// Create Alert Controlller
export const getAllPilots = async (req: Request, res: AuthResponse) => {
  const userGroup = await UserGroup.findOne({ name: "pilot" });
  const users = await User.find({
    tenantId: res.locals.user.tenantId._id,
    userGroupId: userGroup._id,
  });
  return res.json({
    status: true,
    message: `pilot ${users.length} data fetched successfully`,
    data: users,
  });
};
