import { pool } from "../db.js";

const publicUserFields = "id, name, email, created_at";

export async function createUser({ name, email, password_hash }) {
  const [result] = await pool.execute(
    "INSERT INTO users (name, email, password_hash) VALUES (:name, :email, :password_hash)",
    { name, email, password_hash }
  );
  return findUserById(result.insertId);
}

export async function findUserByEmail(email) {
  const [rows] = await pool.execute("SELECT * FROM users WHERE email = :email LIMIT 1", { email });
  return rows[0] || null;
}

export async function findUserById(id) {
  const [rows] = await pool.execute(`SELECT ${publicUserFields} FROM users WHERE id = :id LIMIT 1`, { id });
  return rows[0] || null;
}
