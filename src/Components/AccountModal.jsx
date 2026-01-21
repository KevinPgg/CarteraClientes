// src/Components/AccountModal.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import OrderBuilded from "./OrderBuilded";
import PODetalle from "./PODetalle";
import POList from "./POList";
import ResumenOrdenes from "./ResumenOrdenes";
import Sistemas from "./Sistemas";
import { getPedidos } from "../Services/OrderService";
import "../styles/Pedidos.css";
import SelectClient from "./selectClient";
import ToggleVisibilityButton from './ToggleVisibilityButton';



export default function AccountModal() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [pedidos, setPedidos] = useState([]);
  const [viewType, setViewType] = useState("resumen"); // "detalle", "lista", "resumen"
  const [loading, setLoading] = useState(false);

  // Cargar pedidos cuando se abre la pestaña de Pedidos
  useEffect(() => {
    if (active !== 2) return;
    if (auth.tipo === 'C') {
      loadPedidos();
    }
  }, [active, auth.tipo]);

  const loadPedidos = async () => {
    setLoading(true);
    try {
      // Para tipo C: usar auth.cardName; para tipo A/S: usar auth.userSelected
      const clientName = auth.tipo === 'C' ? auth.cardName : auth.userSelected;
      const orders = await getPedidos(clientName);
      console.log("📊 [AccountModal] Pedidos cargados:", orders);
      setPedidos(orders || []);
    } catch (error) {
      console.error("❌ Error cargando pedidos:", error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  };

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
          Pedidos
        </button>
        {auth.tipo === 'S' && (
          <button
            className={`tab-button ${active === 3 ? "active" : ""}`}
            onClick={() => setActive(3)}
          >
            Sistemas
          </button>
        )}
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
          <div className="pedidos-container">
            <h3 style={{ margin: 0 }}>
                {viewType === "resumen" && "Resumen de Órdenes"}
                {viewType === "lista" && "Listado de Órdenes"}
                {viewType === "detalle" && "Detalle de Órdenes"}
            </h3>
            <div className="d-flex justify-content-between align-items-center mb-4 Ccliente">
              {(auth.tipo === 'A' || auth.tipo === 'S') ? (
                <div className="d-flex align-items-center AScliente" style={{ gap: '12px' }}>
                  <SelectClient
                    onChange={({ card_name, pedidos: peds, isLoading }) => {
                      if (auth.setUserSelected) {
                        auth.setUserSelected(card_name || "");
                      }
                      setPedidos(peds || []);
                      setLoading(!!isLoading);
                    }}
                  />
                  <div>
                    <label style={{ marginRight: "0.5rem", fontWeight: "500" }}>Vista:</label>
                    <select 
                      className="form-select" 
                      style={{ width: "200px" }}
                      value={viewType} 
                      onChange={(e) => setViewType(e.target.value)}
                    >
                      <option value="resumen">Resumen</option>
                      <option value="lista">Listado</option>
                      <option value="detalle">Detalle</option>
                    </select>
                  </div>
                  {(viewType === "detalle")?(<ToggleVisibilityButton 
                    classNames={["selector-po", "info-po"]}
                    label="Filtros"
                    iconSrc="/data/filter.png"
                  />):null}
                  
                </div>
              ) : (
                <select 
                  className="form-select" 
                  style={{ width: "200px" }}
                  value={viewType} 
                  onChange={(e) => setViewType(e.target.value)}
                >
                  <option value="resumen">Resumen</option>
                  <option value="lista">Listado</option>
                  <option value="detalle">Detalle</option>
                </select>
              )}  
              {((viewType === "detalle")&&(auth.tipo==='C'))?(<ToggleVisibilityButton 
                    classNames={["selector-po", "info-po"]}
                    label="Filtros"
                    iconSrc="/data/filter.png"
                  />):null}
            </div>

            {loading ? (
              <div className="alert alert-info">Cargando pedidos...</div>
            ) : pedidos.length === 0 ? (
              <div className="alert alert-warning">No hay pedidos para mostrar</div>
            ) : (
              <>
                {viewType === "resumen" && <ResumenOrdenes pedidos={pedidos} cardName={auth.tipo === 'C' ? auth.cardName : auth.userSelected} />}
                {viewType === "lista" && <POList pedidos={pedidos} cardName={auth.tipo === 'C' ? auth.cardName : auth.userSelected} />}
                {viewType === "detalle" && <PODetalle pedidos={pedidos} cardName={auth.tipo === 'C' ? auth.cardName : auth.userSelected} />}
              </>
            )}
          </div>
        )}

        {active === 3 && auth.tipo === 'S' && (
          <div>
            <Sistemas />
          </div>
        )}
      </div>
    </div>
  );
}