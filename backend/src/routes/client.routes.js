import { Router } from "express";
import {
  deleteSharedClientAccess,
  getClient,
  getClientPayments,
  getClientPaymentYears,
  getClientShares,
  getClients,
  importClients,
  postClientShare,
  postClientPayment,
  postClient,
  putClient,
  removeClient
} from "../controllers/client.controller.js";
import { asyncHandler } from "../libs/asyncHandler.js";
import { authRequired } from "../middlewares/authRequired.js";
import { upload } from "../middlewares/upload.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { clientIdSchema, clientSchema, paymentSchema, shareClientSchema, shareIdSchema } from "../schemas/client.schema.js";

const router = Router();

router.use(authRequired);
router.get("/", asyncHandler(getClients));
router.post("/", clientSchema, validateSchema, asyncHandler(postClient));
router.post("/import", upload.single("file"), asyncHandler(importClients));
router.get("/:id/shares", clientIdSchema, validateSchema, asyncHandler(getClientShares));
router.post("/:id/shares", [...clientIdSchema, ...shareClientSchema], validateSchema, asyncHandler(postClientShare));
router.delete("/:id/shares/:shareId", [...clientIdSchema, ...shareIdSchema], validateSchema, asyncHandler(deleteSharedClientAccess));
router.get("/:id/payment-years", clientIdSchema, validateSchema, asyncHandler(getClientPaymentYears));
router.get("/:id/payments", clientIdSchema, validateSchema, asyncHandler(getClientPayments));
router.get("/:id", clientIdSchema, validateSchema, asyncHandler(getClient));
router.put("/:id", [...clientIdSchema, ...clientSchema], validateSchema, asyncHandler(putClient));
router.post("/:id/payment", [...clientIdSchema, ...paymentSchema], validateSchema, asyncHandler(postClientPayment));
router.delete("/:id", clientIdSchema, validateSchema, asyncHandler(removeClient));

export default router;
