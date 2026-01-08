// src/Layout/NavMenu.jsx
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function NavMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { title: "Inicio", path: "/", icon: "🏠" },
    { title: "Mi Cuenta", path: "/account", icon: "👤" },
    { title: "Tienda", path: "/shop", icon: "🛍️" },
    { title: "Login", path: "/login", icon: "🔑" },
  ];

  const handleNavigate = (path) => {
    navigate(path);
    setIsOpen(false); // Cierra el menú al navegar
  };

  return (
    <>
      {/* Botón hamburguesa con hover effect ☰ → v */}
      <button 
        className="hamburger-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Menú"
      >
        <span className="hamburger-icon">{"☰"}</span>
      </button>

      {/* Menú modal - solo se muestra cuando está abierto */}
      {isOpen && (
        <>
          <nav className="nav-menu open">
            <ul>
              {menuItems.map((item) => (
                <li key={item.path}>
                  <button
                    className={`nav-button ${location.pathname === item.path ? "active" : ""}`}
                    onClick={() => handleNavigate(item.path)}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-text">{item.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
          <div 
            className="nav-overlay"
            onClick={() => setIsOpen(false)}
          ></div>
        </>
      )}
    </>
  );
}