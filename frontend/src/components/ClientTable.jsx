import { Link } from "react-router-dom";
import { getBillingStatus, getDebtSummary } from "../utils/billing.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

export default function ClientTable({ clients, onCollect, onDelete, onViewReceipt }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Telefono</th>
            <th>Indicador</th>
            <th>Plan mensual</th>
            <th>Por cobrar</th>
            <th>Fecha de cobro</th>
            <th>Comprobante</th>
            <th>Usuario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((client) => {
            const billing = getBillingStatus(client);
            const debt = getDebtSummary(client);
            const hasPayment = Boolean(client.last_payment_date);
            const paymentLabel =
              hasPayment && debt.amount <= 0
                ? "Pago confirmado"
                : hasPayment && client.last_payment_type === "partial"
                  ? "Amortizo"
                  : "Sin pago confirmado";

            return (
              <tr key={client.id}>
                <td>
                  <strong>{client.full_name}</strong>
                  <small>{client.document_number || "Sin documento"}</small>
                </td>
                <td>{client.phone || "-"}</td>
                <td>
                  <span className={`status billing-${billing.key}`}>{billing.label}</span>
                </td>
                <td>
                  <strong>{formatCurrency(client.amount_due)}</strong>
                  <small>Plan: {formatDate(billing.nextChargeDate || client.due_date)}</small>
                </td>
                <td>
                  <strong>{debt.formattedLabel}</strong>
                </td>
                <td>
                  <strong>{formatDate(client.last_payment_date)}</strong>
                  <small>{paymentLabel}</small>
                </td>
                <td>
                  {client.latest_receipt_path ? (
                    <button
                      className="icon-only"
                      type="button"
                      onClick={() => onViewReceipt(client)}
                      title={client.latest_receipt_name || "Ver comprobante"}
                      aria-label="Ver comprobante"
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M12 5c5.2 0 9.2 4.2 10.4 6.3a1.4 1.4 0 0 1 0 1.4C21.2 14.8 17.2 19 12 19S2.8 14.8 1.6 12.7a1.4 1.4 0 0 1 0-1.4C2.8 9.2 6.8 5 12 5Zm0 2C7.9 7 4.6 10.1 3.5 12c1.1 1.9 4.4 5 8.5 5s7.4-3.1 8.5-5C19.4 10.1 16.1 7 12 7Zm0 2.2A2.8 2.8 0 1 1 12 14.8 2.8 2.8 0 0 1 12 9.2Zm0 2A.8.8 0 1 0 12 12.8.8.8 0 0 0 12 11.2Z" />
                      </svg>
                    </button>
                  ) : (
                    <span className="no-receipt">-</span>
                  )}
                </td>
                <td>{client.owner_name}</td>
                <td className="actions">
                  {client.payment_status === "pending" && client.phone && (
                    <button className="small-button collect-button" onClick={() => onCollect(client)}>
                      Cobrar
                    </button>
                  )}
                  <Link className="small-link" to={`/clientes/${client.id}/editar`}>
                    Editar
                  </Link>
                  <button className="danger-button" onClick={() => onDelete(client.id)}>
                    Eliminar
                  </button>
                </td>
              </tr>
            );
          })}
          {clients.length === 0 && (
            <tr>
              <td colSpan="9" className="empty">
                No hay clientes para mostrar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
