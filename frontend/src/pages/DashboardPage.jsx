import { useEffect, useState } from "react";
import { dashboardApi } from "../api/dashboard.js";
import { formatCurrency, formatDate } from "../utils/formatters.js";

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    dashboardApi.get().then(setData).catch((err) => setError(err.message));
  }, []);

  const summary = data?.summary || {};
  const totalClients = Number(summary.total || 0);
  const paidClients = Number(summary.paid || 0);
  const pendingClients = Number(summary.pending || 0);
  const paidRate = totalClients ? Math.round((paidClients / totalClients) * 100) : 0;
  const pendingRate = totalClients ? Math.round((pendingClients / totalClients) * 100) : 0;

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Reportes generales de cartera, cumplimiento de pagos y deuda pendiente.</p>
        </div>
      </header>

      {error && <div className="alert">{error}</div>}

      <section className="stats-grid">
        <article className="stat">
          <span>Total clientes</span>
          <strong>{totalClients}</strong>
        </article>
        <article className="stat">
          <span>Al dia</span>
          <strong>{paidClients}</strong>
        </article>
        <article className="stat">
          <span>Pendientes</span>
          <strong>{pendingClients}</strong>
        </article>
        <article className="stat">
          <span>Monto pendiente</span>
          <strong>{formatCurrency(summary.pending_amount || 0)}</strong>
        </article>
      </section>

      <section className="report-grid">
        <article className="panel report-panel">
          <div className="panel-title">
            <div>
              <h2>Cumplimiento de pagos</h2>
              <p>Distribucion general entre clientes al dia y pendientes.</p>
            </div>
          </div>
          <div className="progress-row">
            <div>
              <strong>{paidRate}%</strong>
              <span>Clientes al dia</span>
            </div>
            <div className="progress-track">
              <span style={{ width: `${paidRate}%` }} />
            </div>
          </div>
          <div className="report-metrics">
            <span>{paidRate}% al dia</span>
            <span>{pendingRate}% pendiente</span>
          </div>
        </article>

        <article className="panel report-panel">
          <div className="panel-title">
            <div>
              <h2>Riesgo de cobro</h2>
              <p>Clientes pendientes y monto total por recuperar.</p>
            </div>
          </div>
          <div className="risk-summary">
            <strong>{formatCurrency(summary.pending_amount || 0)}</strong>
            <span>{pendingClients} clientes con pago pendiente</span>
          </div>
        </article>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Pagos pendientes</h2>
              <p>Clientes priorizados por fecha de vencimiento.</p>
            </div>
          </div>
          <div className="compact-list">
            {(data?.pendingClients || []).map((client) => (
              <article key={client.id} className="compact-row">
                <div>
                  <strong>{client.full_name}</strong>
                  <small>
                    {formatDate(client.due_date)} - {formatCurrency(client.amount_due)}
                  </small>
                </div>
                <span className="status pending">Pendiente</span>
              </article>
            ))}
            {(data?.pendingClients || []).length === 0 && <p className="muted">No hay pendientes.</p>}
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">
            <div>
              <h2>Clientes al dia</h2>
              <p>Ultimos clientes marcados como pagados.</p>
            </div>
          </div>
          <div className="compact-list">
            {(data?.paidClients || []).map((client) => (
              <article key={client.id} className="compact-row">
                <div>
                  <strong>{client.full_name}</strong>
                  <small className="owner-name">{client.owner_name}</small>
                </div>
                <span className="status paid">Al dia</span>
              </article>
            ))}
            {(data?.paidClients || []).length === 0 && <p className="muted">Aun no hay clientes al dia.</p>}
          </div>
        </div>
      </section>
    </div>
  );
}
