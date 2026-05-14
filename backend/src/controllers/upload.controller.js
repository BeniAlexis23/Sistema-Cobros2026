import { getSignedS3Url, isS3Enabled } from "../libs/s3.js";
import { createInvoiceFile, findLatestInvoiceFileByClientId } from "../models/invoice.model.js";
import { uploadReceiptFile } from "../libs/storage.js";

export async function uploadInvoice(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Invoice file is required" });
  }

  const storedFile = await uploadReceiptFile(req.file, {
    folder: `clients/${req.body.client_id || "unassigned"}/payments`
  });

  const file = await createInvoiceFile({
    client_id: req.body.client_id || null,
    user_id: req.user.id,
    original_name: req.file.originalname,
    file_name: storedFile.fileName,
    mime_type: req.file.mimetype,
    file_path: storedFile.filePath
  });

  res.status(201).json({ file });
}

export async function getLatestInvoiceView(req, res) {
  const file = await findLatestInvoiceFileByClientId(req.params.clientId, req.user.id);

  if (!file) {
    return res.status(404).json({ message: "Receipt not found" });
  }

  const isRemoteFile = /^https?:\/\//i.test(file.file_path);
  const url = isS3Enabled() && isRemoteFile
    ? await getSignedS3Url(file.file_name, { contentType: file.mime_type })
    : file.file_path;

  res.json({
    file: {
      id: file.id,
      original_name: file.original_name,
      mime_type: file.mime_type,
      url
    }
  });
}
