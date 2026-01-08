// src/Components/AccountModal.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import OrderBuilded from "./OrderBuilded";

export default function AccountModal() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);

  const handleLogout = () => {
    auth.logout();
    navigate("/");
  };

  return (
    <div className="account-modal">
      <div className="tabs">
        <button
          className={`tab-button ${active === 0 ? "active" : ""}`}
          onClick={() => setActive(0)}
        >
          General
        </button>
        <button
          className={`tab-button ${active === 1 ? "active" : ""}`}
          onClick={() => setActive(1)}
        >
          Cartera
        </button>
        <button
          className={`tab-button ${active === 2 ? "active" : ""}`}
          onClick={() => setActive(2)}
        >
          Deudas
        </button>
      </div>

      <div className="tab-content">
        {active === 0 && (
          <div>
            <h3 style={{marginTop:"24px"}}>Información General</h3>
            {auth.isAuthenticated ? (
              <div className="user-info-card">
                <div className="user-details">
                  <strong>{auth.cardName}</strong>
                  <div className="user-subtitle">
                    Código: {auth.cardCode}
                  </div>
                  <div className="user-subtitle">
                    Activo desde {auth.loginTime ? new Date(auth.loginTime).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
                <button className="logout-button" onClick={handleLogout}>
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div>
                <p>No hay usuario autenticado.</p>
                <a className="primary-button" href="/login">
                  Iniciar sesión
                </a>
              </div>
            )}
          </div>
        )}
        
        {active === 1 && (
          <div>
              <OrderBuilded showDebtOnly={false} userType={auth.tipo} />
          </div>
        )}
        
        {active === 2 && (
          <div>
            <p>Aquí van las deudas 👹</p>
          </div>
        )}
      </div>
    </div>
  );
}