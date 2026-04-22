import { pool } from "../db.js";

const baseSelect = `
  SELECT
    c.*,
    u.name AS owner_name,
    u.email AS owner_email,
    (
      SELECT f.file_path
      FROM invoice_files f
      WHERE f.client_id = c.id
      ORDER BY f.created_at DESC
      LIMIT 1
    ) AS latest_receipt_path,
    (
      SELECT f.original_name
      FROM invoice_files f
      WHERE f.client_id = c.id
      ORDER BY f.created_at DESC
      LIMIT 1
    ) AS latest_receipt_name
  FROM clients c
  INNER JOIN users u ON u.id = c.user_id
`;

export async function listClients(userId, filters = {}) {
  const where = ["c.user_id = :userId"];
  const params = { userId };

  if (filters.status) {
    where.push("c.payment_status = :status");
    params.status = filters.status;
  }

  if (filters.search) {
    where.push("(c.full_name LIKE :search OR c.document_number LIKE :search OR c.phone LIKE :search)");
    params.search = `%${filters.search}%`;
  }

  const [rows] = await pool.execute(
    `${baseSelect} WHERE ${where.join(" AND ")} ORDER BY c.created_at DESC`,
    params
  );
  return rows.map(normalizeClientRow);
}

export async function findClientById(id, userId) {
  const [rows] = await pool.execute(`${baseSelect} WHERE c.id = :id AND c.user_id = :userId LIMIT 1`, {
    id,
    userId
  });
  return rows[0] ? normalizeClientRow(rows[0]) : null;
}

export async function createClient(userId, data) {
  const payload = normalizeClientPayload(data);
  const [result] = await pool.execute(
    `INSERT INTO clients
      (user_id, full_name, document_number, phone, email, address, payment_status, amount_due, billing_year, paid_months, balance_due, due_date, notes)
     VALUES
      (:user_id, :full_name, :document_number, :phone, :email, :address, :payment_status, :amount_due, :billing_year, :paid_months, :balance_due, :due_date, :notes)`,
    { user_id: userId, ...payload }
  );
  await upsertClientPaymentYear(result.insertId, userId, payload.billing_year, JSON.parse(payload.paid_months));
  return findClientById(result.insertId, userId);
}

export async function updateClient(id, userId, data) {
  const payload = normalizeClientPayload(data);
  await pool.execute(
    `UPDATE clients SET
      full_name = :full_name,
      document_number = :document_number,
      phone = :phone,
      email = :email,
      address = :address,
      payment_status = :payment_status,
      amount_due = :amount_due,
      billing_year = :billing_year,
      paid_months = :paid_months,
      balance_due = :balance_due,
      due_date = :due_date,
      notes = :notes
     WHERE id = :id AND user_id = :userId`,
    { id, userId, ...payload }
  );
  await upsertClientPaymentYear(id, userId, payload.billing_year, JSON.parse(payload.paid_months));
  return findClientById(id, userId);
}

export async function confirmClientPayment(id, userId, data) {
  const client = await findClientById(id, userId);
  if (!client) return null;

  const planAmount = Number(client.amount_due || 0);
  const paidMonths = normalizePaidMonths(client.paid_months);
  const dueMonths = getDueMonths(client.billing_year, paidMonths);
  const currentDebt = getClientDebt(client, dueMonths);
  const amountPaid = data.payment_type === "full" ? currentDebt : Math.min(Number(data.amount_paid || 0), currentDebt);
  const balanceDue = Math.max(currentDebt - amountPaid, 0);
  let updatedPaidMonths = paidMonths;

  if (balanceDue === 0) {
    updatedPaidMonths = normalizePaidMonths([...paidMonths, ...dueMonths]);
  } else if (planAmount > 0) {
    const coveredMonths = Math.floor(amountPaid / planAmount);
    updatedPaidMonths = normalizePaidMonths([...paidMonths, ...dueMonths.slice(0, coveredMonths)]);
  }

  await pool.execute(
    `UPDATE clients SET
      paid_months = :paid_months,
      payment_status = :payment_status,
      balance_due = :balance_due,
      last_payment_date = :last_payment_date,
      last_payment_amount = :last_payment_amount,
      last_payment_type = :last_payment_type
     WHERE id = :id AND user_id = :userId`,
    {
      id,
      userId,
      paid_months: JSON.stringify(updatedPaidMonths),
      payment_status: getPaymentStatusFromMonths(updatedPaidMonths, balanceDue),
      balance_due: balanceDue,
      last_payment_date: data.payment_date,
      last_payment_amount: amountPaid,
      last_payment_type: data.payment_type
    }
  );

  await pool.execute(
    `INSERT INTO payment_records
      (client_id, user_id, payment_date, payment_type, amount_paid, balance_after)
     VALUES
      (:client_id, :user_id, :payment_date, :payment_type, :amount_paid, :balance_after)`,
    {
      client_id: id,
      user_id: userId,
      payment_date: data.payment_date,
      payment_type: data.payment_type,
      amount_paid: amountPaid,
      balance_after: balanceDue
    }
  );
  await upsertClientPaymentYear(id, userId, client.billing_year, updatedPaidMonths);

  return findClientById(id, userId);
}

export async function listClientPayments(id, userId, year = null) {
  const where = ["pr.client_id = :id", "pr.user_id = :userId", "c.user_id = :userId"];
  const params = { id, userId };

  if (year) {
    where.push("YEAR(pr.payment_date) = :year");
    params.year = Number(year);
  }

  const [rows] = await pool.execute(
    `SELECT pr.*
     FROM payment_records pr
     INNER JOIN clients c ON c.id = pr.client_id
     WHERE ${where.join(" AND ")}
     ORDER BY pr.payment_date DESC, pr.created_at DESC`,
    params
  );
  return rows;
}

export async function listClientPaymentYears(id, userId) {
  const [rows] = await pool.execute(
    `SELECT billing_year, paid_months
     FROM client_payment_years
     WHERE client_id = :id AND user_id = :userId
     ORDER BY billing_year DESC`,
    { id, userId }
  );
  const years = rows.map((row) => ({
    billing_year: row.billing_year,
    paid_months: parsePaidMonths(row.paid_months)
  }));
  const client = await findClientById(id, userId);

  if (client && !years.some((item) => Number(item.billing_year) === Number(client.billing_year))) {
    years.unshift({
      billing_year: client.billing_year,
      paid_months: client.paid_months
    });
  }

  return years.sort((a, b) => b.billing_year - a.billing_year);
}

export async function deleteClient(id, userId) {
  const [result] = await pool.execute("DELETE FROM clients WHERE id = :id AND user_id = :userId", { id, userId });
  return result.affectedRows > 0;
}

export async function bulkCreateClients(userId, clients) {
  const created = [];

  for (const client of clients) {
    if (!client.full_name) continue;
    created.push(await createClient(userId, client));
  }

  return created;
}

export async function getClientStats(userId) {
  const [summaryRows] = await pool.execute(
    `SELECT
      COUNT(*) AS total,
      COALESCE(SUM(payment_status = 'paid'), 0) AS paid,
      COALESCE(SUM(payment_status = 'pending'), 0) AS pending,
      COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN IF(balance_due > 0, balance_due, amount_due) ELSE 0 END), 0) AS pending_amount
     FROM clients
     WHERE user_id = :userId`,
    { userId }
  );

  const [pendingRows] = await pool.execute(
    `${baseSelect}
     WHERE c.user_id = :userId AND c.payment_status = 'pending'
     ORDER BY c.due_date IS NULL, c.due_date ASC, c.created_at DESC
     LIMIT 10`,
    { userId }
  );

  const [paidRows] = await pool.execute(
    `${baseSelect}
     WHERE c.user_id = :userId AND c.payment_status = 'paid'
     ORDER BY c.updated_at DESC
     LIMIT 10`,
    { userId }
  );

  return {
    summary: summaryRows[0],
    pendingClients: pendingRows.map(normalizeClientRow),
    paidClients: paidRows.map(normalizeClientRow)
  };
}

function normalizeClientPayload(data) {
  const paidMonths = normalizePaidMonths(data.paid_months);
  const balanceDue = Number(data.balance_due || 0);

  return {
    full_name: data.full_name,
    document_number: data.document_number || null,
    phone: data.phone || null,
    email: data.email || null,
    address: data.address || null,
    payment_status: getPaymentStatusFromMonths(paidMonths, balanceDue),
    amount_due: Number(data.amount_due || 0),
    billing_year: Number(data.billing_year || new Date().getFullYear()),
    paid_months: JSON.stringify(paidMonths),
    balance_due: balanceDue,
    due_date: data.due_date || null,
    notes: data.notes || null
  };
}

function normalizePaidMonths(value) {
  const months = Array.isArray(value) ? value : [];
  return [...new Set(months.map(Number).filter((month) => month >= 1 && month <= 12))].sort((a, b) => a - b);
}

function getPaymentStatusFromMonths(paidMonths, balanceDue = 0) {
  const currentMonth = new Date().getMonth() + 1;
  return paidMonths.includes(currentMonth) && Number(balanceDue) === 0 ? "paid" : "pending";
}

function normalizeClientRow(row) {
  const paidMonths = parsePaidMonths(row.paid_months);
  const dueMonths = getDueMonths(row.billing_year, paidMonths);
  const balanceDue = getClientDebt({ ...row, paid_months: paidMonths }, dueMonths);

  return {
    ...row,
    paid_months: paidMonths,
    owed_months_count: dueMonths.length,
    owed_months: dueMonths,
    balance_due: balanceDue
  };
}

function parsePaidMonths(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    return JSON.parse(value);
  } catch (_error) {
    return [];
  }
}

function getDueMonths(billingYear, paidMonths) {
  const now = new Date();
  const year = Number(billingYear || now.getFullYear());
  const maxMonth = year < now.getFullYear() ? 12 : year === now.getFullYear() ? now.getMonth() + 1 : 0;

  return Array.from({ length: maxMonth }, (_item, index) => index + 1).filter((month) => !paidMonths.includes(month));
}

function getClientDebt(client, dueMonths = null) {
  const storedBalance = Number(client.balance_due || 0);
  if (storedBalance > 0) return storedBalance;

  const months = dueMonths || getDueMonths(client.billing_year, normalizePaidMonths(client.paid_months));
  return months.length * Number(client.amount_due || 0);
}

async function upsertClientPaymentYear(clientId, userId, billingYear, paidMonths) {
  await pool.execute(
    `INSERT INTO client_payment_years (client_id, user_id, billing_year, paid_months)
     VALUES (:client_id, :user_id, :billing_year, :paid_months)
     ON DUPLICATE KEY UPDATE paid_months = VALUES(paid_months)`,
    {
      client_id: clientId,
      user_id: userId,
      billing_year: Number(billingYear || new Date().getFullYear()),
      paid_months: JSON.stringify(normalizePaidMonths(paidMonths))
    }
  );
}
