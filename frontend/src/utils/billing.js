const SOON_DAYS = 5;

export function getBillingStatus(client, today = new Date()) {
  const debt = getDebtSummary(client);

  if (client.payment_status === "paid" && debt.amount <= 0) {
    return {
      key: "paid",
      label: "Al dia",
      detail: "Pago registrado",
      nextChargeDate: getMonthlyChargeDate(client.due_date, today)
    };
  }

  const nextChargeDate = getMonthlyChargeDate(client.due_date, today);
  if (!nextChargeDate) {
    return {
      key: "pending",
      label: "Pendiente",
      detail: "Sin fecha mensual",
      nextChargeDate: null
    };
  }

  const daysUntilCharge = diffInDays(startOfDay(nextChargeDate), startOfDay(today));

  if (daysUntilCharge > 0 && daysUntilCharge <= SOON_DAYS) {
    return {
      key: "soon",
      label: "Por cobrar pronto",
      detail: `Faltan ${daysUntilCharge} dias`,
      nextChargeDate
    };
  }

  if (daysUntilCharge === 0) {
    return {
      key: "due-today",
      label: "Vence hoy",
      detail: "Cobro del mes",
      nextChargeDate
    };
  }

  if (daysUntilCharge < 0) {
    const overdueMonths = debt.months || Math.max(1, monthDiff(nextChargeDate, today));
    return {
      key: "overdue",
      label: `Debe ${overdueMonths} mes${overdueMonths > 1 ? "es" : ""}`,
      detail: debt.amount > 0 ? `Saldo por cobrar: ${debt.formattedLabel}` : `Atraso de ${Math.abs(daysUntilCharge)} dias`,
      nextChargeDate
    };
  }

  return {
    key: "pending",
    label: "Pendiente",
    detail: "Fuera de ventana de cobro",
    nextChargeDate
  };
}

export function getDebtSummary(client) {
  const months = Number(client.owed_months_count || 0);
  const planAmount = Number(client.amount_due || 0);
  const calculatedAmount = months * planAmount;
  const amount = Number(client.balance_due || 0) > 0 ? Number(client.balance_due) : calculatedAmount;

  return {
    months,
    amount,
    formattedLabel: new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN"
    }).format(amount)
  };
}

export function getMonthlyChargeDate(value, today = new Date()) {
  if (!value) return null;

  const base = new Date(value);
  if (Number.isNaN(base.getTime())) return null;

  const chargeDay = base.getDate();
  const current = new Date(today.getFullYear(), today.getMonth(), 1);
  const day = Math.min(chargeDay, daysInMonth(current.getFullYear(), current.getMonth()));
  return new Date(current.getFullYear(), current.getMonth(), day);
}

function monthDiff(fromDate, toDate) {
  return (toDate.getFullYear() - fromDate.getFullYear()) * 12 + toDate.getMonth() - fromDate.getMonth() + 1;
}

function diffInDays(toDate, fromDate) {
  return Math.round((toDate - fromDate) / 86400000);
}

function daysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
