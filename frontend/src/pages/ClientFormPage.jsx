import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { clientsApi } from "../api/clients.js";
import ClientForm from "../components/ClientForm.jsx";

export default function ClientFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    clientsApi
      .get(id)
      .then(({ client: currentClient }) => setClient(currentClient))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSubmit(payload) {
    setError("");
    try {
      if (id) {
        await clientsApi.update(id, payload);
      } else {
        await clientsApi.create(payload);
      }
      navigate("/clientes");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <div>
          <h1>{id ? "Editar cliente" : "Agregar cliente"}</h1>
          <p>Registra el contrato indefinido, plan mensual y meses pagados del año.</p>
        </div>
        <Link className="secondary-link" to="/clientes">
          Volver a clientes
        </Link>
      </header>

      {error && <div className="alert">{error}</div>}
      {loading ? (
        <section className="panel">Cargando cliente...</section>
      ) : (
        <ClientForm selectedClient={client} onCancel={() => navigate("/clientes")} onSubmit={handleSubmit} />
      )}
    </div>
  );
}
