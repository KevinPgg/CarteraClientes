// src/Components/OrderBuilded.jsx
import { useEffect, useMemo, useState } from "react";
import { getOrders, getAllOrders } from "../Services/OrderService";
import { useAuth } from "../contexts/AuthContext";

export default function OrderBuilded({ showDebtOnly = false, userType }) {
  const auth = useAuth();
  const tipo = userType || auth.tipo;

  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Para tipo "A" - Administrador
  const [allClients, setAllClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [activeTab, setActiveTab] = useState("general");

  // filtros
  const [filterDocNum, setFilterDocNum] = useState("");
  const [filterTipo, setFilterTipo] = useState("");
  const [filterDias, setFilterDias] = useState(null);
  
  // Filtros de fecha Entrada
  const [filterTypeEnt, setFilterTypeEnt] = useState(""); // "mes", "semestre", "año"
  const [filterValueEnt, setFilterValueEnt] = useState("");
  
  // Filtros de fecha Vencimiento
  const [filterTypeVenc, setFilterTypeVenc] = useState("");
  const [filterValueVenc, setFilterValueVenc] = useState("");
  
  // Toggle para mostrar/ocultar filtros
  const [isFilterRowVisible, setIsFilterRowVisible] = useState(true);

  // Estado para ordenamiento
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" }); // "asc" o "desc"

  const formatUSD = (value) =>
    value.toLocaleString("es-EC", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  useEffect(() => {
    let mounted = true;
    
    const loadOrders = async () => {
      let orders = [];
      let clients = [];

      if (tipo === "A" || tipo === "S") {
        // Administrador o Supervisor: obtener todas las órdenes
        console.log(`Cuentas cliente: ${auth.cardName}`);
        orders = await getAllOrders();
        
        // Extraer clientes únicos
        const clientSet = new Set();
        orders.forEach((o) => {
          if (o.cardCode && o.cardName) {
            clientSet.add(JSON.stringify({ code: o.cardCode, name: o.cardName }));
          }
        });
        
        clients = Array.from(clientSet).map((c) => JSON.parse(c)).sort((a, b) => a.name.localeCompare(b.name));
        setAllClients(clients);
        // Seleccionar el primer cliente por defecto
        if (clients.length > 0 && !selectedClient) {
          setSelectedClient(clients[0].code);
        }
      } else {
        // Cliente: obtener solo sus órdenes
        if (auth.cardCode) {
          console.log(`Cuentas cliente: ${auth.cardName}`);
          orders = await getOrders(auth.cardCode);
        }
      }
      
      if (!mounted) return;
      
      setAllOrders(orders);
      setIsLoading(false);
    };
    
    if ((tipo === "A" || tipo === "S") || auth.cardCode) {
      loadOrders();
    }
    
    return () => {
      mounted = false;
    };
  }, [tipo, auth.cardCode, selectedClient]);

  const yearOptions = useMemo(() => {
    const years = new Set();
    allOrders.forEach((o) => {
      const raw = o.docDueDate || o.docDate;
      if (!raw) return;
      const d = new Date(raw);
      if (!Number.isNaN(d.getTime())) {
        years.add(d.getFullYear());
      }
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [allOrders]);

  const semesterOptions = useMemo(() => {
    const options = [];
    yearOptions.forEach((year) => {
      options.push({ label: `${year}-S1`, value: `${year}-1` });
      options.push({ label: `${year}-S2`, value: `${year}-2` });
    });
    return options;
  }, [yearOptions]);

  useEffect(() => {
    applyFilters();
  }, [filterDocNum, filterTipo, filterDias, filterTypeEnt, filterValueEnt, filterTypeVenc, filterValueVenc, allOrders, showDebtOnly, sortConfig, selectedClient, activeTab]);

  const applyFilters = () => {
    let query = [...allOrders];

    // Para tipo "A", filtrar por cliente seleccionado
    if ((tipo === "A" || tipo === "S") && selectedClient && activeTab === "general") {
      query = query.filter((x) => x.cardCode?.toLowerCase() === selectedClient.toLowerCase());
    }

    // Si showDebtOnly está activo, mostrar solo deudas
    if (showDebtOnly) {
      query = query.filter((x) => x.dias_pendientes > 0);
    }

    if (filterDocNum.trim() !== "") {
      query = query.filter(
        (x) =>
          (x.folioNum && x.folioNum.toLowerCase().includes(filterDocNum.toLowerCase())) ||
          x.docNum.toString().includes(filterDocNum)
      );
    }

    if (filterTipo.trim() !== "") {
      query = query.filter((x) => x.tipoCliente === filterTipo);
    }

    if (filterDias !== null && filterDias !== "") {
      query = query.filter((x) => x.dias_pendientes >= parseInt(filterDias));
    }

    // Filtro de Fecha Entrada
    if (filterTypeEnt && filterValueEnt) {
      query = query.filter((order) => {
        const raw = order.docDate;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        if (filterTypeEnt === "mes" && month !== Number(filterValueEnt)) return false;
        if (filterTypeEnt === "semestre") {
          const [filterYear, filterSem] = filterValueEnt.split("-");
          const sem = month <= 6 ? 1 : 2;
          if (year !== Number(filterYear) || sem !== Number(filterSem)) return false;
        }
        if (filterTypeEnt === "año" && year !== Number(filterValueEnt)) return false;
        return true;
      });
    }

    // Filtro de Fecha Vencimiento
    if (filterTypeVenc && filterValueVenc) {
      query = query.filter((order) => {
        const raw = order.docDueDate;
        if (!raw) return false;
        const d = new Date(raw);
        if (Number.isNaN(d.getTime())) return false;
        const month = d.getMonth() + 1;
        const year = d.getFullYear();

        if (filterTypeVenc === "mes" && month !== Number(filterValueVenc)) return false;
        if (filterTypeVenc === "semestre") {
          const [filterYear, filterSem] = filterValueVenc.split("-");
          const sem = month <= 6 ? 1 : 2;
          if (year !== Number(filterYear) || sem !== Number(filterSem)) return false;
        }
        if (filterTypeVenc === "año" && year !== Number(filterValueVenc)) return false;
        return true;
      });
    }

    // Aplicar ordenamiento
    if (sortConfig.key) {
      query.sort((a, b) => {
        let aVal, bVal;

        switch (sortConfig.key) {
          case "docDate":
            aVal = new Date(a.docDate).getTime();
            bVal = new Date(b.docDate).getTime();
            break;
          case "docDueDate":
            aVal = new Date(a.docDueDate).getTime();
            bVal = new Date(b.docDueDate).getTime();
            break;
          case "dias_pendientes":
            aVal = a.dias_pendientes;
            bVal = b.dias_pendientes;
            break;
          case "docTotal":
            aVal = a.docTotal;
            bVal = b.docTotal;
            break;
          case "saldoPorVencer":
            aVal = getSaldoPorVencer(a);
            bVal = getSaldoPorVencer(b);
            break;
          case "r0_30":
            aVal = getMontoRangoValue(a, 0, 30);
            bVal = getMontoRangoValue(b, 0, 30);
            break;
          case "r30_60":
            aVal = getMontoRangoValue(a, 30, 60);
            bVal = getMontoRangoValue(b, 30, 60);
            break;
          case "r60_90":
            aVal = getMontoRangoValue(a, 60, 90);
            bVal = getMontoRangoValue(b, 60, 90);
            break;
          case "r90_120":
            aVal = getMontoRangoValue(a, 90, 120);
            bVal = getMontoRangoValue(b, 90, 120);
            break;
          case "r120":
            aVal = getMontoRangoValue(a, 120, 9999);
            bVal = getMontoRangoValue(b, 120, 9999);
            break;
          default:
            return 0;
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    setFilteredOrders(query);
  };

  const getSaldoPorVencer = (o) => {
    if (o.dias_pendientes >= 0 && o.dias_pendientes < 30) {
      return 0;
    }
    return o.docTotal;
  };

  const getMontoRangoValue = (o, min, max) => {
    if (o.dias_pendientes >= min && o.dias_pendientes < max) {
      return o.docTotal;
    }
    return 0;
  };

  const getBadgeClass = (dias) => {
    if (dias < 0) return "badge badge_less30"; // verde
    return "vencido text-dark"; // rojo
  };

  const totals = filteredOrders.reduce(
    (acc, o) => {
      const saldo = getSaldoPorVencer(o);
      acc.total += o.docTotal;
      acc.saldo += saldo;
      acc.r0_30 += getMontoRangoValue(o, 0, 30);
      acc.r30_60 += getMontoRangoValue(o, 30, 60);
      acc.r60_90 += getMontoRangoValue(o, 60, 90);
      acc.r90_120 += getMontoRangoValue(o, 90, 120);
      acc.r120 += getMontoRangoValue(o, 120, 9999);
      return acc;
    },
    { total: 0, saldo: 0, r0_30: 0, r30_60: 0, r60_90: 0, r90_120: 0, r120: 0 }
  );

  const pct = (value, total) => (total > 0 ? `${((value / total) * 100).toFixed(1)}%` : "-");

  const handleSort = (key) => {
    if (sortConfig.key === key) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      // Si es una columna nueva, ordenar ascendente
      setSortConfig({ key, direction: "asc" });
    }
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span style={{ marginLeft: "4px", opacity: 0.3 }}>⇅</span>;
    return <span style={{ marginLeft: "4px" }}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  const title = tipo === "A" || tipo === "S" ? "Monitoreo de Cartera" : (showDebtOnly ? "Deudas Pendientes" : "Estado de Cartera");

  // Vista para administrador/supervisor
  if (tipo === "A" || tipo === "S") {
    return (
      <div className="container-fluid mt-4">
        {/* Pestañas */}
        <div className="nav nav-tabs mb-3" role="tablist">
          <button
            className={`nav-link ${activeTab === "general" ? "active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            className={`nav-link ${activeTab === "cuenta" ? "active" : ""}`}
            onClick={() => setActiveTab("cuenta")}
          >
            Cuenta
          </button>
        </div>

        {/* Tab General */}
        {activeTab === "general" && (
          <>
            <div className="d-flex" 
              style={{ display: "flex", flexDirection:"row", marginBottom: "1rem", justifyContent: "space-between", alignItems:"center" }}>
              <div>
                <h3 className="mb-0">{title}</h3>
                <div style={{ marginTop: "0.5rem" }}>
                  <label style={{ marginRight: "0.5rem", fontWeight: "500" }}>Cliente:</label>
                  <select
                    className="form-select form-select-sm"
                    style={{ maxWidth: "400px", display: "inline-block" }}
                    value={selectedClient}
                    onChange={(e) => setSelectedClient(e.target.value)}
                  >
                    {allClients.map((client) => (
                      <option key={client.code} value={client.code}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <button
                className=""
                onClick={() => setIsFilterRowVisible(!isFilterRowVisible)}
                title={isFilterRowVisible ? "Ocultar filtros" : "Mostrar filtros"}
              >
                <img src="/data/filter.png" alt="Filtros" style={{ width: "20px", height: "20px" }} />
                {isFilterRowVisible ? "Ocultar" : "Mostrar"} Filtros
              </button>
            </div>

            <div
              className="table-responsive shadow-sm"
              style={{ borderRadius: "8px", border: "1px solid #e6e6e6", height: "68vh" }}
            >
              <TableContent
                isLoading={isLoading}
                filteredOrders={filteredOrders}
                isFilterRowVisible={isFilterRowVisible}
                filterDocNum={filterDocNum}
                setFilterDocNum={setFilterDocNum}
                filterTypeEnt={filterTypeEnt}
                setFilterTypeEnt={setFilterTypeEnt}
                filterValueEnt={filterValueEnt}
                setFilterValueEnt={setFilterValueEnt}
                yearOptions={yearOptions}
                semesterOptions={semesterOptions}
                filterTypeVenc={filterTypeVenc}
                setFilterTypeVenc={setFilterTypeVenc}
                filterValueVenc={filterValueVenc}
                setFilterValueVenc={setFilterValueVenc}
                filterDias={filterDias}
                setFilterDias={setFilterDias}
                filterTipo={filterTipo}
                setFilterTipo={setFilterTipo}
                getBadgeClass={getBadgeClass}
                formatUSD={formatUSD}
                getSaldoPorVencer={getSaldoPorVencer}
                getMontoRangoValue={getMontoRangoValue}
                totals={totals}
                pct={pct}
                handleSort={handleSort}
                SortIcon={SortIcon}
              />
            </div>
          </>
        )}

        {/* Tab Cuenta */}
        {activeTab === "cuenta" && (
          <div className="alert alert-info">
            <p>Sección de Cuenta disponible próximamente.</p>
          </div>
        )}
      </div>
    );
  }

  // Vista para cliente
  return (
    <div className="container-fluid mt-4">
      <div className="d-flex" 
        style={{ display: "flex", flexDirection:"row", marginBottom: "0 !important", justifyContent: "space-between", alignItems:"center" }}>
        <h3 className="mb-0">{title}</h3>
        <button
          className=""
          onClick={() => setIsFilterRowVisible(!isFilterRowVisible)}
          title={isFilterRowVisible ? "Ocultar filtros" : "Mostrar filtros"}
        >
          <img src="/data/filter.png" alt="Filtros" style={{ width: "20px", height: "20px" }} />
          {isFilterRowVisible ? "Ocultar" : "Mostrar"} Filtros
        </button>
      </div>

      <div
        className="table-responsive shadow-sm"
        style={{ borderRadius: "8px", border: "1px solid #e6e6e6", height: "68vh" }}
      >
        <TableContent
          isLoading={isLoading}
          filteredOrders={filteredOrders}
          isFilterRowVisible={isFilterRowVisible}
          filterDocNum={filterDocNum}
          setFilterDocNum={setFilterDocNum}
          filterTypeEnt={filterTypeEnt}
          setFilterTypeEnt={setFilterTypeEnt}
          filterValueEnt={filterValueEnt}
          setFilterValueEnt={setFilterValueEnt}
          yearOptions={yearOptions}
          semesterOptions={semesterOptions}
          filterTypeVenc={filterTypeVenc}
          setFilterTypeVenc={setFilterTypeVenc}
          filterValueVenc={filterValueVenc}
          setFilterValueVenc={setFilterValueVenc}
          filterDias={filterDias}
          setFilterDias={setFilterDias}
          filterTipo={filterTipo}
          setFilterTipo={setFilterTipo}
          getBadgeClass={getBadgeClass}
          formatUSD={formatUSD}
          getSaldoPorVencer={getSaldoPorVencer}
          getMontoRangoValue={getMontoRangoValue}
          totals={totals}
          pct={pct}
          handleSort={handleSort}
          SortIcon={SortIcon}
        />
      </div>
    </div>
  );
}

// Componente reutilizable para la tabla
function TableContent(props) {
  const {
    isLoading,
    filteredOrders,
    isFilterRowVisible,
    filterDocNum,
    setFilterDocNum,
    filterTypeEnt,
    setFilterTypeEnt,
    filterValueEnt,
    setFilterValueEnt,
    yearOptions,
    semesterOptions,
    filterTypeVenc,
    setFilterTypeVenc,
    filterValueVenc,
    setFilterValueVenc,
    filterDias,
    setFilterDias,
    filterTipo,
    setFilterTipo,
    getBadgeClass,
    formatUSD,
    getSaldoPorVencer,
    getMontoRangoValue,
    totals,
    pct,
    handleSort,
    SortIcon,
  } = props;

  
}
