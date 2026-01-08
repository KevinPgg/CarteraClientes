// src/Pages/ProductDetails.jsx
import { useNavigate } from "react-router-dom";

export default function ProductDetails() {
  const navigate = useNavigate();

  return (
    <div className="product-details-page">
      <h1>📦 Detalle del Producto</h1>
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p style={{ fontSize: "1.2rem", marginBottom: "1rem" }}>
          Detalle de productos en desarrollo.
        </p>
        <button onClick={() => navigate("/")} className="primary-button">
          Volver al Inicio
        </button>
      </div>
    </div>
  );
}