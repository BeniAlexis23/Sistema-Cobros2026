import dotenv from "dotenv";

dotenv.config();

function parseBoolean(value, defaultValue) {
  if (value === undefined) {
    return defaultValue;
  }

  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  dbAutoSetup: parseBoolean(process.env.DB_AUTO_SETUP, process.env.NODE_ENV !== "production"),
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:5173",
  uploadsDir: process.env.UPLOADS_DIR || "src/uploads",
  storageDriver: process.env.STORAGE_DRIVER || "local",
  jwtSecret: process.env.JWT_SECRET || "dev_secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "8h",
  aws: {
    region: process.env.AWS_REGION || "",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
    bucket: process.env.AWS_S3_BUCKET || "",
    baseUrl: process.env.AWS_S3_BASE_URL || ""
  },
  db: {
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "sistema_cobros"
  }
};
