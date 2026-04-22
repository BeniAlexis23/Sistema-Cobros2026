import { verifyToken } from "../libs/jwt.js";
import { findUserById } from "../models/user.model.js";

export async function authRequired(req, _res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      const error = new Error("Authentication token is required");
      error.status = 401;
      throw error;
    }

    const payload = verifyToken(token);
    const user = await findUserById(payload.id);

    if (!user) {
      const error = new Error("User not found");
      error.status = 401;
      throw error;
    }

    req.user = user;
    next();
  } catch (_error) {
    const error = new Error("Invalid or expired token");
    error.status = 401;
    next(error);
  }
}
