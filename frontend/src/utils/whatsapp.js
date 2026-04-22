import { formatCurrency, formatDate } from "./formatters.js";

export function buildWhatsappLink(client, invoiceUrl = "") {
  const phone = String(client.phone || "").replace(/\D/g, "");
  const message = [
    `Hola ${client.full_name}, te escribimos para recordarte tu pago pendiente.`,
    `Monto: ${formatCurrency(client.amount_due)}.`,
    client.due_date ? `Fecha mensual de cobro: ${formatDate(client.due_date)}.` : "",
    invoiceUrl ? `Boleta/factura: ${invoiceUrl}` : "",
    "Por favor, envianos la confirmacion cuando realices el pago. Gracias."
  ]
    .filter(Boolean)
    .join(" ");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
