import mongoose from "mongoose";

import newTenantSchema, { INewTenant } from "../schemas/newTenant";

const newTenant = mongoose.model<INewTenant>("new_tenant", newTenantSchema);
export default newTenant;
