import mongoose from "mongoose";

import paymentSchema, { IPayment } from "../schemas/payment";

const Payment = mongoose.model<IPayment>("payment", paymentSchema);

export default Payment;
