// src/Pages/OrderConfirmation.jsx
import { useNavigate } from "react-router-dom";

export default function OrderConfirmation() {
  const navigate = useNavigate();

  return (
    <div className="order-confirmation-page">
      <h1>✅ Confirmación de Pedido</h1>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
          Confirmación de pedidos en desarrollo.
        </p>
        <button onClick={() => navigate("/account")} className="primary-button">
          Ver Mi Cuenta
        </button>
      </div>
    </div>
  );
}