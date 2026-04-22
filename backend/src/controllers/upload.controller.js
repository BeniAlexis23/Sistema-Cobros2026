import { createInvoiceFile } from "../models/invoice.model.js";

export async function uploadInvoice(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "Invoice file is required" });
  }

  const file = await createInvoiceFile({
    client_id: req.body.client_id || null,
    user_id: req.user.id,
    original_name: req.file.originalname,
    file_name: req.file.filename,
    mime_type: req.file.mimetype,
    file_path: `/uploads/${req.file.filename}`
  });

  res.status(201).json({ file });
}
