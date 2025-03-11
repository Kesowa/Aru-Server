import { model } from "mongoose";

import { inviteSchema, IInvite } from "../schemas/invite";

export const inviteModel = model<IInvite>("invite", inviteSchema);
