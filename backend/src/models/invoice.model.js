import { pool } from "../db.js";

export async function createInvoiceFile({ client_id, user_id, original_name, file_name, mime_type, file_path }) {
  const [result] = await pool.execute(
    `INSERT INTO invoice_files
      (client_id, user_id, original_name, file_name, mime_type, file_path)
     VALUES
      (:client_id, :user_id, :original_name, :file_name, :mime_type, :file_path)`,
    { client_id, user_id, original_name, file_name, mime_type, file_path }
  );
  return findInvoiceFileById(result.insertId, user_id);
}

export async function findInvoiceFileById(id, userId) {
  const [rows] = await pool.execute(
    "SELECT * FROM invoice_files WHERE id = :id AND user_id = :userId LIMIT 1",
    { id, userId }
  );
  return rows[0] || null;
}

export async function findLatestInvoiceFileByClientId(clientId, userId) {
  const [rows] = await pool.execute(
    `SELECT *
     FROM invoice_files
     WHERE client_id = :clientId
     ORDER BY created_at DESC, id DESC
     LIMIT 1`,
    { clientId }
  );
  return rows[0] || null;
}
