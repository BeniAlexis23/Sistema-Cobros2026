import multer from "multer";

const allowed = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "text/csv",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
]);

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) {
      return cb(new Error("Only PDF, PNG, JPG, CSV or Excel files are allowed"));
    }
    return cb(null, true);
  }
});
