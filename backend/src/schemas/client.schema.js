import { body, param } from "express-validator";

export const clientIdSchema = [param("id").isInt({ min: 1 }).withMessage("Client id is invalid")];
export const shareIdSchema = [param("shareId").isInt({ min: 1 }).withMessage("Share id is invalid")];

export const paymentSchema = [
  body("payment_date").isISO8601().withMessage("Payment date is required"),
  body("payment_type").isIn(["full", "partial"]).withMessage("Payment type is invalid"),
  body("amount_paid").isFloat({ min: 0.01 }).withMessage("Payment amount must be greater than zero")
];

export const clientSchema = [
  body("full_name").trim().isLength({ min: 2 }).withMessage("Client name is required"),
  body("document_number").optional({ nullable: true }).trim().isLength({ max: 30 }),
  body("phone").optional({ nullable: true }).trim().isLength({ max: 30 }),
  body("email").optional({ nullable: true, checkFalsy: true }).isEmail().withMessage("Email is invalid"),
  body("address").optional({ nullable: true }).trim().isLength({ max: 255 }),
  body("payment_status").optional().isIn(["paid", "pending"]).withMessage("Payment status is invalid"),
  body("amount_due").optional().isFloat({ min: 0 }).withMessage("Amount due must be positive"),
  body("billing_year").optional().isInt({ min: 2000, max: 2100 }).withMessage("Billing year is invalid"),
  body("paid_months").optional().isArray().withMessage("Paid months must be an array"),
  body("paid_months.*").optional().isInt({ min: 1, max: 12 }).withMessage("Paid month is invalid"),
  body("due_date").optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage("Due date is invalid"),
  body("notes").optional({ nullable: true }).trim()
];

export const shareClientSchema = [
  body("email").trim().isEmail().withMessage("Shared user email is invalid"),
  body("permission").isIn(["read", "edit"]).withMessage("Share permission is invalid")
];
