import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">SC</span>
          <div>
            <strong>Sistema Cobros</strong>
            <small>{user?.name}</small>
          </div>
        </div>

        <nav className="nav">
          <NavLink to="/" end>
            Dashboard
          </NavLink>
          <NavLink to="/clientes">Clientes</NavLink>
          <NavLink to="/reportes">Reportes</NavLink>
        </nav>

        <button className="ghost-button" onClick={handleLogout}>
          Cerrar sesion
        </button>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
