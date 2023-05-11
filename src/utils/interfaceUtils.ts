import { Response } from "express";
import { IUser } from "../schemas/user";
import { LeanDocument } from "mongoose";
import { IPermission } from "../schemas/permission";

export type AuthResponse = Response & {
  locals: {
    user: LeanDocument<
      Omit<IUser, "customPermissions"> & {
        customPermissions: { permissions: IPermission[] }[];
      }
    >;
    log: logFace;
    advancedResults: any;
  };
};

export interface logFace {
  status: number;
  route: string;
  userID?: string;
  ACTION?: string;
  message: string;
  timestamp: Date;
  error?: Error;
}
