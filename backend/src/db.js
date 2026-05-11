import mysql from "mysql2/promise";
import { config } from "./config.js";

export const pool = mysql.createPool({
  ...config.db,
  charset: "utf8mb4",
  waitForConnections: true,
  connectionLimit: 10,
  namedPlaceholders: true
});

export async function pingDatabase() {
  const connection = await pool.getConnection();
  try {
    await connection.ping();
  } finally {
    connection.release();
  }
}
