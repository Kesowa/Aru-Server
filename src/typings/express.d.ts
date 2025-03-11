// Doesn't work
// import type { LeanDocument } from "mongoose";
// import type { IUser } from "../schemas/user";
// import type { IPermission } from "../schemas/permission";

import { Request } from "express";

import { AuthResponse } from "../utils/interfaceUtils";

// declare module "express-serve-static-core" {
//   namespace e {
//     interface Response {
//       locals: {
//         user: LeanDocument<
//           Omit<IUser, "customPermissions"> & {
//             customPermissions: { permissions: IPermission[] }[];
//           }
//         >;
//       }
//     }
//   }

// }

declare namespace e {
  export interface RequestHandler {
    (req: Request, res: AuthResponse): Promise<void>;
  }
}

export = e;
