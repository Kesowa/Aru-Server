import mongoose from "mongoose";

import tenantSchema, { ITenant } from "../schemas/tenant";

const Tenant = mongoose.model<ITenant>("tenant", tenantSchema);

export default Tenant;
