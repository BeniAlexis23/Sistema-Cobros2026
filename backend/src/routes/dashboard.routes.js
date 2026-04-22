import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { asyncHandler } from "../libs/asyncHandler.js";
import { authRequired } from "../middlewares/authRequired.js";

const router = Router();

router.get("/", authRequired, asyncHandler(getDashboard));

export default router;
