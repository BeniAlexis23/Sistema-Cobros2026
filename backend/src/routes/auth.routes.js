import { Router } from "express";
import { login, me, register } from "../controllers/auth.controller.js";
import { asyncHandler } from "../libs/asyncHandler.js";
import { authRequired } from "../middlewares/authRequired.js";
import { validateSchema } from "../middlewares/validateSchema.js";
import { loginSchema, registerSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", registerSchema, validateSchema, asyncHandler(register));
router.post("/login", loginSchema, validateSchema, asyncHandler(login));
router.get("/me", authRequired, me);

export default router;
