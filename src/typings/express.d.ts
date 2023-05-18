// Doesn't work
// import type { LeanDocument } from "mongoose";
// import type { IUser } from "../schemas/user";
// import type { IPermission } from "../schemas/permission";

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