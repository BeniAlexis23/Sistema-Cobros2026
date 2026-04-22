import { useEffect, useMemo, useState } from "react";
import { clientsApi } from "../api/clients.js";
import { getDebtSummary } from "../utils/billing.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

const months = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic"
];

export default function ReportsPage() {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [paymentYears, setPaymentYears] = useState([]);
  const [payments, setPayments] = useState([]);
  const [error, setError] = useState("");

  const selectedClient = useMemo(
    () => clients.find((client) => String(client.id) === String(selectedClientId)),
    [clients, selectedClientId]
  );
  const debt = selectedClient ? getDebtSummary(selectedClient) : null;
  const totalPaid = payments.reduce((sum, payment) => sum + Number(payment.amount_paid || 0), 0);
  const selectedYearRecord = paymentYears.find((item) => String(item.billing_year) === String(selectedYear));
  const selectedPaidMonths =
    selectedYearRecord?.paid_months ||
    (String(selectedClient?.billing_year) === String(selectedYear) ? selectedClient?.paid_months : []) ||
    [];

  useEffect(() => {
    clientsApi
      .list()
      .then(({ clients: rows }) => {
        setClients(rows);
        if (rows.length > 0) setSelectedClientId(String(rows[0].id));
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    if (!selectedClientId) return;

    clientsApi
      .paymentYears(selectedClientId)
      .then(({ years }) => {
        const nextYears = years.length > 0 ? years : [{ billing_year: new Date().getFullYear(), paid_months: [] }];
        setPaymentYears(nextYears);
        setSelectedYear(String(nextYears[0].billing_year));
      })
      .catch((err) => setError(err.message));
  }, [selectedClientId]);

  useEffect(() => {
    if (!selectedClientId || !selectedYear) return;

    clientsApi
      .payments(selectedClientId, selectedYear)
      .then(({ payments: rows }) => setPayments(rows))
      .catch((err) => setError(err.message));
  }, [selectedClientId, selectedYear]);

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Reportes</h1>
          <p>Historial de pagos por cliente y resumen de deuda.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="reports-layout">
        <aside className="panel report-client-list">
          <div className="panel-title">
            <div>
              <h2>Clientes</h2>
              <p>Selecciona un cliente para ver su historial.</p>
            </div>
          </div>

          <div className="report-search-list">
            {clients.map((client) => (
              <button
                key={client.id}
                type="button"
                className={String(client.id) === String(selectedClientId) ? "client-report-item active" : "client-report-item"}
                onClick={() => setSelectedClientId(String(client.id))}
              >
                <strong>{client.full_name}</strong>
                <small>{client.document_number || client.phone || "Sin documento"}</small>
              </button>
            ))}
            {clients.length === 0 && <p className="muted">No hay clientes registrados.</p>}
          </div>
        </aside>

        <section className="panel report-detail">
          {selectedClient ? (
            <>
              <div className="panel-title">
                <div>
                  <h2>{selectedClient.full_name}</h2>
                  <p>Plan mensual: {formatCurrency(selectedClient.amount_due)}</p>
                </div>
                <select value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}>
                  {paymentYears.map((item) => (
                    <option key={item.billing_year} value={item.billing_year}>
                      {item.billing_year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="report-summary-grid">
                <article>
                  <span>Total pagado</span>
                  <strong>{formatCurrency(totalPaid)}</strong>
                </article>
                <article>
                  <span>Por cobrar</span>
                  <strong>{formatCurrency(debt?.amount || 0)}</strong>
                </article>
                <article>
                  <span>Meses pendientes</span>
                  <strong>{debt?.months || 0}</strong>
                </article>
              </div>

              <section className="month-report">
                <div className="panel-title">
                  <div>
                    <h2>Meses pagados {selectedYear}</h2>
                    <p>Incluye meses marcados desde el registro o edicion del cliente para el año seleccionado.</p>
                  </div>
                </div>
                <div className="month-report-grid">
                  {months.map((month, index) => {
                    const monthNumber = index + 1;
                    const isPaid = selectedPaidMonths.includes(monthNumber);

                    return (
                      <span key={month} className={isPaid ? "month-report-box paid" : "month-report-box pending"}>
                        {month}
                      </span>
                    );
                  })}
                </div>
              </section>

              <div className="table-wrap">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Monto pagado</th>
                      <th>Saldo posterior</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id}>
                        <td>{formatDate(payment.payment_date)}</td>
                        <td>{payment.payment_type === "full" ? "Al contado" : "Amortizacion"}</td>
                        <td>{formatCurrency(payment.amount_paid)}</td>
                        <td>{formatCurrency(payment.balance_after)}</td>
                      </tr>
                    ))}
                    {payments.length === 0 && (
                      <tr>
                        <td colSpan="4" className="empty">
                          Este cliente aun no tiene pagos registrados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="muted">Selecciona un cliente para ver su reporte.</p>
          )}
        </section>
      </section>
    </div>
  );
}
