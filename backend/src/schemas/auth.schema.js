import { body } from "express-validator";

export const registerSchema = [
  body("name").trim().isLength({ min: 2 }).withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must have at least 6 characters")
];

export const loginSchema = [
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];
