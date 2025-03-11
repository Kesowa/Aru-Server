import { Response } from "express";
import { LeanDocument } from "mongoose";

import { PERMS } from "../schemas/permission";
import { ITenant } from "../schemas/tenant";
import { IUser } from "../schemas/user";

export type AuthResponse = Response & {
  locals: {
    user: LeanDocument<
      Omit<IUser, "customPermissions" | "tenantId"> & {
        customPermissions: PERMS[];
        tenantId: ITenant;
      }
    >;
    log: LogFace;
    advancedResults: any;
  };
};

export interface LogFace {
  status: number;
  route: string;
  userID?: string;
  ACTION?: string;
  message: string;
  timestamp: Date;
  error?: Error;
}
