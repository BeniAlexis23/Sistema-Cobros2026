import { Router } from "express";
import { getLatestInvoiceView, uploadInvoice } from "../controllers/upload.controller.js";
import { asyncHandler } from "../libs/asyncHandler.js";
import { authRequired } from "../middlewares/authRequired.js";
import { upload } from "../middlewares/upload.js";

const router = Router();

router.post("/invoice", authRequired, upload.single("file"), asyncHandler(uploadInvoice));
router.get("/invoice/client/:clientId/latest", authRequired, asyncHandler(getLatestInvoiceView));

export default router;
