import fs from "fs";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, "..", config.uploadsDir.replace(/^src[\\/]/, ""));

fs.mkdirSync(uploadDir, { recursive: true });

const allowed = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error("Only PDF, PNG, JPG, CSV or Excel files are allowed"));
    }
    return cb(null, true);
  }
});
