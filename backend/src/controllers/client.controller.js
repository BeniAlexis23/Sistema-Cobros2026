import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import fs from "fs";
import {
  bulkCreateClients,
  confirmClientPayment,
  createClient,
  deleteClient,
  findClientById,
  listClientPayments,
  listClientPaymentYears,
  listClients,
  updateClient
} from "../models/client.model.js";

export async function getClients(req, res) {
  const clients = await listClients(req.user.id, {
    status: req.query.status,
    search: req.query.search
  });
  res.json({ clients });
}

export async function getClient(req, res) {
  const client = await findClientById(req.params.id, req.user.id);
  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }
  res.json({ client });
}

export async function postClient(req, res) {
  const client = await createClient(req.user.id, req.body);
  res.status(201).json({ client });
}

export async function putClient(req, res) {
  const client = await updateClient(req.params.id, req.user.id, req.body);
  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }
  res.json({ client });
}

export async function postClientPayment(req, res) {
  const client = await confirmClientPayment(req.params.id, req.user.id, req.body);
  if (!client) {
    return res.status(404).json({ message: "Client not found" });
  }
  res.json({ client });
}

export async function getClientPayments(req, res) {
  const payments = await listClientPayments(req.params.id, req.user.id, req.query.year);
  res.json({ payments });
}

export async function getClientPaymentYears(req, res) {
  const years = await listClientPaymentYears(req.params.id, req.user.id);
  res.json({ years });
}

export async function removeClient(req, res) {
  const deleted = await deleteClient(req.params.id, req.user.id);
  if (!deleted) {
    return res.status(404).json({ message: "Client not found" });
  }
  res.status(204).send();
}

export async function importClients(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "CSV or Excel file is required" });
  }

  const rows = await parseImportFile(req.file);
  const clients = rows.map(mapImportedClient);
  const created = await bulkCreateClients(req.user.id, clients);

  res.status(201).json({
    imported: created.length,
    skipped: clients.length - created.length,
    clients: created
  });
}

async function parseImportFile(file) {
  const buffer = fs.readFileSync(file.path);

  if (file.mimetype === "text/csv") {
    return parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];

  const headers = [];
  sheet.getRow(1).eachCell((cell, colNumber) => {
    headers[colNumber] = normalizeHeader(cell.value);
  });

  const rows = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const item = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      if (headers[colNumber]) {
        item[headers[colNumber]] = normalizeCellValue(cell.value);
      }
    });
    rows.push(item);
  });

  return rows;
}

function mapImportedClient(row) {
  return {
    full_name: row.full_name || row.nombre || row.cliente || row.name,
    document_number: row.document_number || row.documento || row.dni || row.ruc,
    phone: row.phone || row.telefono || row.celular || row.whatsapp,
    email: row.email || row.correo,
    address: row.address || row.direccion,
    payment_status: normalizeStatus(row.payment_status || row.estado_pago || row.estado),
    amount_due: row.amount_due || row.monto_pendiente || row.deuda || 0,
    billing_year: row.billing_year || row.anio_facturacion || new Date().getFullYear(),
    paid_months: parsePaidMonths(row.paid_months || row.meses_pagados),
    due_date: row.due_date || row.fecha_vencimiento || null,
    notes: row.notes || row.notas || row.observaciones
  };
}

function normalizeStatus(value) {
  const status = String(value || "").toLowerCase();
  if (["paid", "pagado", "al dia", "aldia"].includes(status)) return "paid";
  return "pending";
}

function parsePaidMonths(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  return String(value)
    .split(/[,\s;|]+/)
    .map(Number)
    .filter((month) => month >= 1 && month <= 12);
}

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function normalizeCellValue(value) {
  if (value && typeof value === "object") {
    if ("text" in value) return value.text;
    if ("result" in value) return value.result;
    if ("richText" in value) return value.richText.map((part) => part.text).join("");
  }
  return value ?? "";
}
