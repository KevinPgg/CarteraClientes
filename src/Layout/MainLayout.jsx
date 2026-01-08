// src/Layout/MainLayout.jsx
import { useNavigate, useLocation } from "react-router-dom";
import NavMenu from "./NavMenu";
import { useAuth } from "../contexts/AuthContext";

export default function MainLayout({ children }) {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  const handleCartClick = () => {
    navigate("/cart");
  };

  // Obtener nombre de página actual
  const getPageName = () => {
    const routes = {
      "/": { name: "Inicio", icon: "🏠" },
      "/home": { name: "Inicio", icon: "🏠" },
      "/account": { name: "Mi Cuenta", icon: "👤" },
      "/shop": { name: "Tienda", icon: "🛍️" },
      "/cart": { name: "Carrito", icon: "🛒" },
      "/login": { name: "Login", icon: "🔑" },
    };
    return routes[location.pathname] || { name: "Página", icon: "📄" };
  };

  const currentPage = getPageName();

  return (
    <>
      <div className="page">
        <main>
          <div className="top-row">
            <div className="folding-menu">
              <NavMenu />
            </div>
            <div className="page-info">
              {auth.cardCode?(
                <>
                  <span className="page-icon">{"👤"}</span>
                  <span className="page-name">{auth.cardName}</span>
                </>
                ) : (
                <>
                  <span className="page-icon">{currentPage.icon}</span>
                  <span className="page-name">{currentPage.name}</span>
                </>  
              )}
            </div>
            <div className="header-actions">
              <button className="layout-cart" onClick={handleCartClick} aria-label="Carrito">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  fill="currentColor"
                  viewBox="0 0 16 16"
                >
                  <path d="M0 1.5A.5.5 0 0 1 .5 1h1a.5.5 0 0 1 .485.379L2.89 5H14.5a.5.5 0 0 1 .49.598l-1.5 6A.5.5 0 0 1 13 12H4a.5.5 0 0 1-.491-.408L1.01 1.607 .5 1.5zM5.5 13a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm6 1a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
                </svg>
              </button>
              {auth.isAuthenticated ? (
                <button className="logout-button" onClick={handleLogout} aria-label="Cerrar Sesión">
                  <span className="text-large">Cerrar Sesión</span>
                  <span className="icon-small">🚪</span>
                </button>
              ) : (
                <a className="login-link" href="/login" aria-label="Iniciar Sesión">
                  <span className="text-large">Iniciar Sesión</span>
                  <span className="icon-small">🔐</span>
                </a>
              )}
            </div>
          </div>

          <article className="content">{children}</article>
        </main>
      </div>
    </>
  );
}