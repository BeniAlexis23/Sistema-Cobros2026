import { useEffect, useState } from "react";

const months = [
  { value: 1, label: "Ene" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Abr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Ago" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dic" }
];

const initialState = {
  full_name: "",
  document_number: "",
  phone: "",
  email: "",
  address: "",
  amount_due: 0,
  billing_year: new Date().getFullYear(),
  paid_months: [],
  due_date: "",
  notes: ""
};

export default function ClientForm({ selectedClient, onCancel, onSubmit }) {
  const [form, setForm] = useState(initialState);

  useEffect(() => {
    if (selectedClient) {
      setForm({
        full_name: selectedClient.full_name || "",
        document_number: selectedClient.document_number || "",
        phone: selectedClient.phone || "",
        email: selectedClient.email || "",
        address: selectedClient.address || "",
        amount_due: selectedClient.amount_due || 0,
        billing_year: selectedClient.billing_year || new Date().getFullYear(),
        paid_months: selectedClient.paid_months || [],
        due_date: selectedClient.due_date ? selectedClient.due_date.slice(0, 10) : "",
        notes: selectedClient.notes || ""
      });
    } else {
      setForm(initialState);
    }
  }, [selectedClient]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleMonth(month) {
    setForm((current) => {
      const paidMonths = current.paid_months.includes(month)
        ? current.paid_months.filter((item) => item !== month)
        : [...current.paid_months, month].sort((a, b) => a - b);

      return { ...current, paid_months: paidMonths };
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await onSubmit(form);
    if (!selectedClient) {
      setForm(initialState);
    }
  }

  return (
    <form className="panel form-grid" onSubmit={handleSubmit}>
      <div className="panel-title">
        <div>
          <h2>{selectedClient ? "Editar cliente" : "Nuevo cliente"}</h2>
          <p>Datos de contacto, contrato, cobro mensual y estado de pago.</p>
          <p className="muted">Contrato indefinido con 12 cobros por año.</p>
        </div>
      </div>

      <label>
        Nombre completo
        <input name="full_name" value={form.full_name} onChange={handleChange} required />
      </label>
      <label>
        Documento
        <input name="document_number" value={form.document_number} onChange={handleChange} />
      </label>
      <label>
        WhatsApp
        <input name="phone" value={form.phone} onChange={handleChange} placeholder="51999999999" />
      </label>
      <label>
        Correo
        <input type="email" name="email" value={form.email} onChange={handleChange} />
      </label>
      <label className="span-2">
        Direccion
        <input name="address" value={form.address} onChange={handleChange} />
      </label>
      <label>
        Plan de facturacion mensual
        <input type="number" min="0" step="0.01" name="amount_due" value={form.amount_due} onChange={handleChange} />
      </label>
      <label>
        Año de facturacion
        <input type="number" min="2000" max="2100" name="billing_year" value={form.billing_year} onChange={handleChange} />
      </label>
      <label>
        Fecha mensual de cobro
        <input type="date" name="due_date" value={form.due_date} onChange={handleChange} />
      </label>
      <fieldset className="month-selector span-2">
        <legend>Meses pagados del año {form.billing_year}</legend>
        <div className="month-grid">
          {months.map((month) => (
            <label key={month.value} className={form.paid_months.includes(month.value) ? "month-box checked" : "month-box"}>
              <input
                type="checkbox"
                checked={form.paid_months.includes(month.value)}
                onChange={() => toggleMonth(month.value)}
              />
              <span>{month.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label className="span-2">
        Notas
        <textarea name="notes" value={form.notes} onChange={handleChange} rows="3" />
      </label>

      <div className="form-actions span-2">
        {selectedClient && (
          <button type="button" className="secondary-button" onClick={onCancel}>
            Cancelar
          </button>
        )}
        <button type="submit">{selectedClient ? "Guardar cambios" : "Crear cliente"}</button>
      </div>
    </form>
  );
}
