import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { config } from "../config.js";

const hasAwsConfig = Boolean(
  config.aws.region &&
    config.aws.accessKeyId &&
    config.aws.secretAccessKey &&
    config.aws.bucket
);

export const s3 = hasAwsConfig
  ? new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey
      }
    })
  : null;

export function isS3Enabled() {
  return config.storageDriver === "s3" && Boolean(s3);
}

export async function uploadToS3({ buffer, contentType, key }) {
  if (!s3) {
    throw new Error("S3 is not configured");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: config.aws.bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType
    })
  );

  return {
    key,
    url: buildS3Url(key)
  };
}

function buildS3Url(key) {
  const baseUrl =
    config.aws.baseUrl || `https://${config.aws.bucket}.s3.${config.aws.region}.amazonaws.com`;

  return `${baseUrl.replace(/\/$/, "")}/${key}`;
}
