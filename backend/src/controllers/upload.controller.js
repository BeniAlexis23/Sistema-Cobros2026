import { createInvoiceFile } from "../models/invoice.model.js";
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
