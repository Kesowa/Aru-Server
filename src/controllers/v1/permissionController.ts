import { Request } from "express";
import { AuthResponse } from "../../utils/interfaceUtils";
import { PERMS, SUPER_ADMIN_PERMS, TENANT_CLIENT_PERMS, TENANT_ROOT_PERMS, TENANT_STAFF_PERMS } from "../../schemas/permission";

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

export const fetchPermissions = async (req: Request, res: AuthResponse) => {
  let permissions: PERMS[];
  switch (res.locals.user.userType) {
    case "super-admin": permissions = [...SUPER_ADMIN_PERMS]; break;
    case "tenant-root": permissions = [...TENANT_ROOT_PERMS]; break;
    case "tenant-staff": permissions = [...TENANT_STAFF_PERMS]; break;
    case "tenant-client": permissions = [...TENANT_CLIENT_PERMS]; break;
    default: permissions = [];
  }
  res.json({
    status: true, 
    message: "Permissions fetched successfully.",
    data: Object.values(permissions)
  })
}
