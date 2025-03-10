import crypto from "crypto";

import { Request } from "express";
import RazorPay from "razorpay";

import {
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
  RAZORPAY_HOOK_SECRET,
} from "../constants";

export const RazorPayInstance = new RazorPay({
  key_id: RAZORPAY_KEY_ID,
  key_secret: RAZORPAY_KEY_SECRET,
});

export const VerifyPaymentSignature = ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
}: {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}) => {
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_KEY_SECRET)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");
  return expectedSignature === razorpay_signature;
};

export const VerifyWebhookSignature = (req: Request) => {
  const signature = req.headers["x-razorpay-signature"];
  const message = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", RAZORPAY_HOOK_SECRET)
    .update(message)
    .digest("hex");
  return expectedSignature === signature;
};
type HookError<T> = T extends "failed" ? string : null;
type Payment<T> = {
  entity: {
    id: string;
    entity: "payment";
    amount: number;
    currency: "INR";
    status: T;
    order_id: string;
    created_at: number;
    error_code: HookError<T>;
    error_description: HookError<T>;
    error_source: HookError<T>;
    error_step: HookError<T>;
    error_reason: HookError<T>;
  };
};

type Order<T> = {
  entity: {
    id: string;
    entity: "order";
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: "INR";
    status: T;
    created_at: number;
  };
};

type OrderPaidWebhookEvent = {
  entity: "event";
  account_id: string;
  event: "order.paid";
  contains: ["payment" | "order"];
  payload: {
    payment: Payment<"captured">;
    order: Order<"paid">;
  };
  created_at: number;
};

type PaymentCapturedWebhookEvent = {
  entity: "event";
  account_id: string;
  event: "payment.captured";
  contains: ["payment"];
  payload: {
    payment: Payment<"captured">;
  };
};
type PaymentFailedWebhookEvent = {
  entity: "event";
  account_id: string;
  event: "payment.failed";
  contains: ["payment"];
  payload: {
    payment: Payment<"failed">;
  };
};

export type WebhookEvent =
  | OrderPaidWebhookEvent
  | PaymentCapturedWebhookEvent
  | PaymentFailedWebhookEvent;
