// src/Pages/Cart.jsx
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Cart() {
  const auth = useAuth();
  const navigate = useNavigate();

  return (
    <div className="cart-page">
      <h1>🛒 Carrito de Compras</h1>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
          El módulo de carrito de compras está en desarrollo.
        </p>
        <p style={{ color: "#666", marginBottom: "2rem" }}>
          Por el momento, consulta el portal de pedidos en tu cuenta.
        </p>
        {auth.isAuthenticated ? (
          <button onClick={() => navigate("/account")} className="primary-button">
            Ver Mi Cuenta
          </button>
        ) : (
          <button onClick={() => navigate("/login")} className="primary-button">
            Iniciar Sesión
          </button>
        )}
      </div>
    </div>
  );
}