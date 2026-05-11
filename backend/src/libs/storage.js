import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { config } from "../config.js";
import { isS3Enabled, uploadToS3 } from "./s3.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const localUploadDir = path.resolve(__dirname, "..", config.uploadsDir.replace(/^src[\\/]/, ""));

fs.mkdirSync(localUploadDir, { recursive: true });

export async function uploadReceiptFile(file, options = {}) {
  const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const folder = options.folder || "receipts";
  const fileName = `${Date.now()}-${safeName}`;

  if (config.storageDriver === "s3" && !isS3Enabled()) {
    throw new Error("S3 storage is enabled but AWS credentials or bucket configuration are missing");
  }

  if (isS3Enabled()) {
    const key = `${folder}/${fileName}`;
    const result = await uploadToS3({
      buffer: file.buffer,
      contentType: file.mimetype,
      key
    });

    return {
      fileName: key,
      filePath: result.url
    };
  }

  const absolutePath = path.join(localUploadDir, fileName);
  await fs.promises.writeFile(absolutePath, file.buffer);

  return {
    fileName,
    filePath: `/uploads/${fileName}`
  };
}
