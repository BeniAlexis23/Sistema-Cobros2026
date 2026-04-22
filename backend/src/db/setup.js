import fs from "fs";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { config } from "../config.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const schemaPath = path.join(__dirname, "schema.sql");

export async function setupDatabase() {
  const connection = await mysql.createConnection({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    multipleStatements: true
  });

  try {
    const schema = fs.readFileSync(schemaPath, "utf8");
    await connection.query(schema);
    await ensureClientBillingColumns(connection);
    console.log(`Database "${config.db.database}" is ready.`);
  } finally {
    await connection.end();
  }
}

async function ensureClientBillingColumns(connection) {
  const [columns] = await connection.query(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'clients'`,
    [config.db.database]
  );
  const existing = new Set(columns.map((column) => column.COLUMN_NAME));
  const statements = [];

  if (!existing.has("billing_year")) {
    statements.push("ADD COLUMN billing_year INT NOT NULL DEFAULT 2026 AFTER amount_due");
  }

  if (!existing.has("paid_months")) {
    statements.push("ADD COLUMN paid_months JSON NULL AFTER billing_year");
  }

  if (!existing.has("balance_due")) {
    statements.push("ADD COLUMN balance_due DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER paid_months");
  }

  if (!existing.has("last_payment_date")) {
    statements.push("ADD COLUMN last_payment_date DATE NULL AFTER balance_due");
  }

  if (!existing.has("last_payment_amount")) {
    statements.push("ADD COLUMN last_payment_amount DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER last_payment_date");
  }

  if (!existing.has("last_payment_type")) {
    statements.push("ADD COLUMN last_payment_type ENUM('full', 'partial') NULL AFTER last_payment_amount");
  }

  if (statements.length > 0) {
    await connection.query(`ALTER TABLE ${config.db.database}.clients ${statements.join(", ")}`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  setupDatabase().catch((error) => {
    console.error("Could not setup database", error.message);
    process.exit(1);
  });
}
