import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { PERMS } from "../../utils/permissions";

//create new  permission
export const createPermission = async (_req: Request, res: AuthResponse) => {
  res.status(404).send();
};

//fetch all permissions
export const fetchAllPermissions = async (_req: Request, res: AuthResponse) => {
  res.json({
    status: true,
    message: "Permissions fetched sucessfully.",
    data: Object.values(PERMS),
  });
};

//fetch tenant permissions
export const fetchTenantPermissions = async (
  _req: Request,
  res: AuthResponse
) => {
  {
    res.json({
      status: true,
      message: "Permissions fetched sucessfully.",
      data: Object.values(PERMS),
    });
  }
};
