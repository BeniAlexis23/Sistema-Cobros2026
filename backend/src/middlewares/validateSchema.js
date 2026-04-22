import { validationResult } from "express-validator";

export function validateSchema(req, _res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }

  const error = new Error("Validation error");
  error.status = 400;
  error.details = errors.array().map((item) => ({
    field: item.path,
    message: item.msg
  }));
  return next(error);
}
