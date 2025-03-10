import { Request } from "express";
import { Types } from "mongoose";
import { Logger } from "pino";

import { RAZORPAY_KEY_ID } from "../../constants";
import Package from "../../models/package";
import Payment from "../../models/payment";
import Tenant from "../../models/tenant";
import User from "../../models/user";
import { AuthResponse } from "../../utils/interfaceUtils";
import {
  RazorPayInstance,
  VerifyPaymentSignature,
  VerifyWebhookSignature,
  WebhookEvent,
} from "../../utils/razorpayUtils";

export const generateOrder = async (
  req: Request<
    unknown,
    unknown,
    { tenantId: Types.ObjectId; package: Types.ObjectId }
  >,
  res: AuthResponse
) => {
  const tenantId = req.body.tenantId;
  const paymentId = RAZORPAY_KEY_ID;

  const packageData = await Package.findOne({ _id: req.body.package });

  if (!packageData) {
    res.status(404).json({
      status: false,
      message: "Package not found",
    });
    return;
  }
  if (
    packageData.price == undefined ||
    packageData.price == null ||
    packageData.price <= 0
  ) {
    res.status(404).json({
      status: false,
      message: "Package price not found",
    });
    return;
  }
  const orderData = {
    amount: packageData.price * 100,
    currency: "INR",
  };

  const new_razorpay_order = await RazorPayInstance.orders.create(orderData);

  const order = await Payment.create({
    razorpay_order_id: new_razorpay_order.id,
    amount: new_razorpay_order.amount,
    currency: new_razorpay_order.currency,
    status: new_razorpay_order.status,
    tenant: tenantId,
    package: req.body.package,
  });

  res.status(200).json({
    status: true,
    data: {
      order,
      paymentId,
    },
  });
};

const buyPackage = async (
  tenantID: Types.ObjectId,
  packageID: Types.ObjectId,
  log: Logger
) => {
  // const session = await mongoose.startSession();
  let success = false;
  try {
    // session.startTransaction();
    log.info("Transaction started");
    await Tenant.updateOne(
      {
        _id: tenantID,
      },
      {
        activePackage: packageID,
        bandwidthUsed: 0,
        packageStartDate: new Date(),
        isActivated: true,
        storageUsed: 0,
        actualSize: new Types.Decimal128("0"),
        actualUserCount: 1,
        actualMissionCount: 0,
        actualAlertCount: 0,
        actualVodCount: 0,
        actualLayerCount: 0,
        actualClientCount: 0,
        actualLocationCount: 0,
        actualUserGroupCount: 0,
      }
    );
    // ).session(session);
    log.info("Updated tenant");
    await User.updateOne(
      {
        userType: "tenant-root",
        tenantId: tenantID,
      },
      {
        isActive: true,
      }
    );
    // ).session(session);
    log.info("Updated user");
    success = true;
    // await session.commitTransaction();
    log.info("Transaction committed");
  } catch (error) {
    log.error(error);
    success = false;
    // await session.abortTransaction();
    log.error("Transaction aborted");
  } finally {
    // await session.endSession();
    log.info("Session ended");
  }
  return success;
};

export const completeOrder = async (
  req: Request<
    unknown,
    unknown,
    {
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }
  >,
  res: AuthResponse
) => {
  const payload = req.body;

  const isValid = VerifyPaymentSignature(payload);

  if (!isValid) {
    res.status(406).json({
      status: false,
      message: "Invalid signature",
    });
    return;
  }

  const paymentUpdate = {
    razorpay_payment_id: payload.razorpay_payment_id,
    razorpay_signature: payload.razorpay_signature,
    status: "completed",
    paidOn: new Date(),
  };

  const paymentObj = await Payment.findOne({
    razorpay_order_id: payload.razorpay_order_id,
  });

  if (!paymentObj) {
    res.status(404).json({
      status: false,
      message: "Payment not found",
    });
    return;
  }

  const success = await buyPackage(
    paymentObj.tenant,
    paymentObj.package,
    req.log
  );

  if (!success) {
    res.status(500).json({
      status: false,
      message: "Failed to buy package",
    });
    return;
  }

  await paymentObj.update(paymentUpdate);

  res.status(200).json({
    status: true,
    message: "Transaction Successfully Completed",
  });
};

export const paymentFail = async (
  req: Request<{}, {}, { payment_id: string; order_id: string }>,
  res: AuthResponse
) => {
  const payload = req.body;
  if (!payload.payment_id || !payload.order_id) {
    throw new Error("Cannot find order id or payment id on req");
  }

  const paymentUpdate = {
    razorpay_payment_id: payload.payment_id,
    status: "failed",
  };

  await Payment.updateOne(
    { razorpay_order_id: payload.order_id },
    paymentUpdate
  );

  res.status(200).json({
    status: false,
    message: "Transaction Failed",
  });
};

export const handleWebhook = async (
  req: Request<{}, {}, WebhookEvent>,
  res: AuthResponse
) => {
  const isValid = VerifyWebhookSignature(req);
  if (!isValid) {
    res.status(400).json({
      status: false,
      message: "Invalid signature",
    });
    return;
  }

  const payment = req.body.payload.payment.entity;

  const paymentRecord = await Payment.findOne({
    razorpay_order_id: payment.order_id,
  });

  if (!paymentRecord) {
    res.status(404).json({
      status: false,
      message: "Payment not found",
    });
    return;
  }

  if (payment.status == "captured") {
    paymentRecord.status = "captured";
    paymentRecord.paidOn = new Date();
    await paymentRecord.save();
    const success = await buyPackage(
      paymentRecord.tenant,
      paymentRecord.package,
      req.log
    );
    if (success) {
      res.status(200).json({
        status: true,
        message: "Package bought successfully",
      });
      return;
    } else {
      res.status(500).json({
        status: false,
        message: "Error processing payment",
      });
    }
    return;
  } else if (payment.status == "failed") {
    paymentRecord.status = "failed";
    await paymentRecord.save();
    res.status(500).json({
      status: true,
      message: "Transaction Failed",
    });
    return;
  } else {
    paymentRecord.status = "unknown";
    await paymentRecord.save();
    res.status(500).json({
      status: true,
      message: "Payment status unknown",
    });
  }
  res.status(404).json({
    status: true,
    message: "Request not processable",
  });
};

export const getAllTenantPayments = async (req: Request, res: AuthResponse) => {
  const tenantId = req.params.tenantId;

  if (!tenantId) {
    return res.json({
      status: false,
      message: "Provide valid tenant id",
    });
  }

  const payments = await Payment.find({ tenant: tenantId });

  res.json({
    status: true,
    data: payments,
  });
};
