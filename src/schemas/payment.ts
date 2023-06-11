import mongoose from "mongoose";
import { Types } from "ts-openapi";

export interface IPayment {
  _id: mongoose.Types.ObjectId;
  razorpay_order_id: string; // index
  razorpay_payment_id: string;
  razorpay_signature: string;
  amount: number;
  currency: string;
  status: "captured" | "failed" | "unknown";
  tenant: mongoose.Types.ObjectId; // index
  paidOn: Date;
  package: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export const PaymentType = {
  _id: Types.String(),
  razorpay_order_id: Types.String(), // index
  razorpay_payment_id: Types.String(),
  razorpay_signature: Types.String(),
  amount: Types.Number(),
  currency: Types.String(),
  status: Types.StringEnum({ values: ["captured", "failed", "unknown"] }),
  tenant: Types.String(), // index
  paidOn: Types.DateTime(),
  package: Types.String(),
  createdAt: Types.DateTime(),
  updatedAt: Types.DateTime(),
}

const paymentSchema = new mongoose.Schema<IPayment>(
  {
    razorpay_order_id: {
      type: String,
      required: true,
    },
    razorpay_payment_id: {
      type: String,
    },
    razorpay_signature: {
      type: String,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
    },
    status: {
      enum: ["complete", "failed", "unknown"],
      // required: true,
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    paidOn: {
      type: Date,
    },
    createdAt: {
      type: Date,
    },
    updatedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);
paymentSchema.index({
  razorpay_order_id: 1,
  tenant: 1,
});
export default paymentSchema;
