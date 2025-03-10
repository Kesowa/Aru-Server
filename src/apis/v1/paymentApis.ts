import express from "express";
import { body, param } from "express-validator";

import { Mode } from "../../constants";
import {
  completeOrder,
  generateOrder,
  handleWebhook,
  paymentFail,
  getAllTenantPayments,
} from "../../controllers/v1/paymentController";
import {
  RobustRunner,
  environmentGuard,
  validator,
} from "../../utils/requestHelpers";
const router = express.Router();

// Note: Removed authentication from payment apis as new tenants are not yet authenticatable when they make the payment

router.post(
  "/generate-order",
  environmentGuard(Mode.Dev),
  // isAuthenticated,
  body("package").isMongoId(),
  // onlyTenantRootAccess,
  validator,
  RobustRunner(generateOrder)
);

router.post(
  "/complete-order",
  environmentGuard(Mode.Dev),
  // isAuthenticated,
  body("razorpay_payment_id").isString().notEmpty(),
  body("razorpay_order_id").isString().notEmpty(),
  body("razorpay_signature").isString().notEmpty(),
  // onlyTenantRootAccess,
  validator,
  RobustRunner(completeOrder)
);

router.post(
  "/payment-fail",
  environmentGuard(Mode.Dev),
  // isAuthenticated,
  // onlyTenantRootAccess,
  body("payment_id").isString().notEmpty(),
  body("order_id").isString().notEmpty(),
  validator,
  RobustRunner(paymentFail)
);

router.post("/handle-webhook", RobustRunner(handleWebhook));

router.get(
  "/get-payments/:tenantId",
  environmentGuard(Mode.Dev),
  // isAuthenticated,
  param("tenantId").isMongoId(),
  validator,
  RobustRunner(getAllTenantPayments)
);

export default router;
