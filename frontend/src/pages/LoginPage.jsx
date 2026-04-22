import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    try {
      await login(form);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <h1>Sistema Cobros</h1>
        <p>Ingresa para revisar clientes al dia, pendientes y gestionar recordatorios.</p>
        <form onSubmit={handleSubmit}>
          <label>
            Correo
            <input
              type="email"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              required
            />
          </label>
          <label>
            Contrasena
            <input
              type="password"
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              required
            />
          </label>
          {error && <div className="alert">{error}</div>}
          <button type="submit">Ingresar</button>
        </form>
        <span>
          No tienes cuenta? <Link to="/registro">Registrate</Link>
        </span>
      </section>
    </main>
  );
}
