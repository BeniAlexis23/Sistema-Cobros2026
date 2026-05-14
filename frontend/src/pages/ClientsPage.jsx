import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { clientsApi } from "../api/clients.js";
import { apiOrigin } from "../api/http.js";
import { uploadsApi } from "../api/uploads.js";
import ClientTable from "../components/ClientTable.jsx";
import { getDebtSummary } from "../utils/billing.js";
import { formatCurrency } from "../utils/formatters.js";
import { buildWhatsappLink } from "../utils/whatsapp.js";

const today = new Date().toISOString().slice(0, 10);

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [filters, setFilters] = useState({ status: "", search: "" });
  const [importFile, setImportFile] = useState(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [collectionClient, setCollectionClient] = useState(null);
  const [receiptClient, setReceiptClient] = useState(null);
  const [receiptView, setReceiptView] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [paymentProofFile, setPaymentProofFile] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    payment_date: today,
    payment_type: "full",
    amount_paid: ""
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const collectionDebt = collectionClient ? getDebtSummary(collectionClient) : null;
  const receiptUrl = receiptView?.url
    ? receiptView.url.startsWith("http")
      ? receiptView.url
      : `${apiOrigin}${receiptView.url}`
    : "";
  const receiptName = receiptView?.original_name || receiptClient?.latest_receipt_name || "Comprobante";
  const isReceiptImage =
    /\.(png|jpe?g)$/i.test(receiptName) || /^image\/(png|jpeg|jpg)$/i.test(receiptView?.mime_type || "");
  const paymentAmount =
    paymentForm.payment_type === "full" ? collectionDebt?.amount || 0 : Number(paymentForm.amount_paid || 0);
  const remainingDebt = Math.max((collectionDebt?.amount || 0) - paymentAmount, 0);

  async function loadClients() {
    const data = await clientsApi.list(filters);
    setClients(data.clients);
  }

  useEffect(() => {
    loadClients().catch((err) => setError(err.message));
  }, [filters.status]);

  async function handleDelete(id) {
    if (!confirm("Eliminar este cliente?")) return;
    await clientsApi.remove(id);
    await loadClients();
  }

  async function handleImport(event) {
    event.preventDefault();
    if (!importFile) return;
    setError("");
    try {
      const result = await clientsApi.import(importFile);
      setMessage(`Importacion completada: ${result.imported} clientes creados.`);
      setImportFile(null);
      setShowImportModal(false);
      event.target.reset();
      await loadClients();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSendCollection(event) {
    event.preventDefault();
    if (!collectionClient) return;

    window.open(buildWhatsappLink(collectionClient), "_blank", "noopener,noreferrer");
  }

  async function handleConfirmPayment(event) {
    event.preventDefault();
    if (!collectionClient || !collectionDebt) return;

    setError("");
    try {
      const amountPaid = paymentForm.payment_type === "full" ? collectionDebt.amount : Number(paymentForm.amount_paid || 0);

      await clientsApi.confirmPayment(collectionClient.id, {
        payment_date: paymentForm.payment_date,
        payment_type: paymentForm.payment_type,
        amount_paid: amountPaid
      });

      if (paymentProofFile) {
        await uploadsApi.invoice({ clientId: collectionClient.id, file: paymentProofFile });
      }

      setMessage(`Pago registrado. Diferencia por cobrar: ${formatCurrency(Math.max(collectionDebt.amount - amountPaid, 0))}.`);
      closeCollectionModal();
      await loadClients();
    } catch (err) {
      setError(err.message);
    }
  }

  function openCollectionModal(client) {
    const debt = getDebtSummary(client);
    setCollectionClient(client);
    setPaymentProofFile(null);
    setPaymentForm({
      payment_date: today,
      payment_type: "full",
      amount_paid: debt.amount
    });
  }

  function closeCollectionModal() {
    setCollectionClient(null);
    setPaymentProofFile(null);
    setPaymentForm({
      payment_date: today,
      payment_type: "full",
      amount_paid: ""
    });
  }

  async function openReceiptModal(client) {
    setReceiptClient(client);
    setReceiptView(null);
    setReceiptLoading(true);
    setError("");

    try {
      const data = await uploadsApi.latestView(client.id);
      setReceiptView(data.file);
    } catch (err) {
      setError(err.message);
      setReceiptClient(null);
    } finally {
      setReceiptLoading(false);
    }
  }

  function closeReceiptModal() {
    setReceiptClient(null);
    setReceiptView(null);
    setReceiptLoading(false);
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Lista de clientes, fechas mensuales de cobro, estados e importacion masiva.</p>
        </div>
        <Link className="primary-link" to="/clientes/nuevo">
          Agregar cliente
        </Link>
      </header>

      {message && <div className="success">{message}</div>}
      {error && <div className="alert">{error}</div>}

      <section className="panel">
        <div className="toolbar clients-toolbar">
          <form className="filters" onSubmit={(event) => event.preventDefault()}>
            <input
              placeholder="Buscar cliente"
              value={filters.search}
              onChange={(event) => setFilters({ ...filters, search: event.target.value })}
              onKeyDown={(event) => {
                if (event.key === "Enter") loadClients();
              }}
            />
            <select value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}>
              <option value="">Todos</option>
              <option value="pending">Pendientes</option>
              <option value="paid">Al dia</option>
            </select>
            <button type="button" className="secondary-button" onClick={loadClients}>
              Buscar
            </button>
          </form>

          <button type="button" className="secondary-button import-trigger" onClick={() => setShowImportModal(true)}>
            Carga masiva
          </button>
        </div>

        <ClientTable
          clients={clients}
          onCollect={openCollectionModal}
          onDelete={handleDelete}
          onViewReceipt={openReceiptModal}
        />
      </section>

      {collectionClient && collectionDebt && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal">
            <div className="panel-title">
              <div>
                <h2>Cobrar a {collectionClient.full_name}</h2>
                <p>Saldo actual: {collectionDebt.formattedLabel} por {collectionDebt.months} mes(es) pendiente(s).</p>
              </div>
            </div>

            <form className="compact-form" onSubmit={handleSendCollection}>
              <div className="notice">
                Se abrira WhatsApp con el mensaje de cobro listo para enviar al cliente.
              </div>

              <button type="submit" className="secondary-button">
                Abrir WhatsApp
              </button>
            </form>

            <form className="payment-box" onSubmit={handleConfirmPayment}>
              <div className="panel-title">
                <div>
                  <h2>Confirmar pago</h2>
                  <p>Registra si pago al contado o si amortizo una parte.</p>
                </div>
              </div>

              <label>
                Fecha en que pago
                <input
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(event) => setPaymentForm({ ...paymentForm, payment_date: event.target.value })}
                  required
                />
              </label>

              <div className="segmented">
                <label className={paymentForm.payment_type === "full" ? "checked" : ""}>
                  <input
                    type="radio"
                    name="payment_type"
                    value="full"
                    checked={paymentForm.payment_type === "full"}
                    onChange={(event) =>
                      setPaymentForm({ ...paymentForm, payment_type: event.target.value, amount_paid: collectionDebt.amount })
                    }
                  />
                  Al contado
                </label>
                <label className={paymentForm.payment_type === "partial" ? "checked" : ""}>
                  <input
                    type="radio"
                    name="payment_type"
                    value="partial"
                    checked={paymentForm.payment_type === "partial"}
                    onChange={(event) => setPaymentForm({ ...paymentForm, payment_type: event.target.value, amount_paid: "" })}
                  />
                  Amortiza parte
                </label>
              </div>

              <label>
                Monto que amortiza
                <input
                  type="number"
                  min="0.01"
                  max={collectionDebt.amount}
                  step="0.01"
                  value={paymentForm.payment_type === "full" ? collectionDebt.amount : paymentForm.amount_paid}
                  disabled={paymentForm.payment_type === "full"}
                  onChange={(event) => setPaymentForm({ ...paymentForm, amount_paid: event.target.value })}
                  required
                />
              </label>

              <label>
                Comprobante de pago
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(event) => setPaymentProofFile(event.target.files?.[0] || null)}
                />
              </label>

              <div className="payment-summary">
                <span>Total por cobrar: {collectionDebt.formattedLabel}</span>
                <strong>Diferencia por cobrar: {formatCurrency(remainingDebt)}</strong>
              </div>

              <button type="submit">Confirmar pago</button>
            </form>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={closeCollectionModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportModal && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal" onSubmit={handleImport}>
            <div className="panel-title">
              <div>
                <h2>Carga masiva</h2>
                <p>Importa clientes desde un archivo Excel o CSV.</p>
              </div>
            </div>

            <label>
              Archivo
              <input
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => setImportFile(event.target.files?.[0] || null)}
              />
            </label>

            <div className="notice">
              Columnas sugeridas: full_name, document_number, phone, email, amount_due, billing_year, paid_months,
              due_date.
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
              >
                Cancelar
              </button>
              <button type="submit">Importar archivo</button>
            </div>
          </form>
        </div>
      )}

      {receiptClient && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal receipt-modal">
            <div className="panel-title">
              <div>
                <h2>Comprobante</h2>
                <p>{receiptClient.full_name} - {receiptName}</p>
              </div>
            </div>

            <div className="receipt-viewer">
              {receiptLoading ? (
                <div className="notice">Cargando comprobante...</div>
              ) : !receiptUrl ? (
                <div className="alert">No se pudo cargar el comprobante.</div>
              ) : isReceiptImage ? (
                <img src={receiptUrl} alt={receiptName} />
              ) : (
                <iframe src={receiptUrl} title={receiptName} />
              )}
            </div>

            <div className="form-actions">
              <button type="button" className="secondary-button" onClick={closeReceiptModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
