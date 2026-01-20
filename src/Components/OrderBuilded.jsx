// src/Components/OrderBuilded.jsx
import { useEffect, useMemo, useState } from "react";
import { getOrders, getAllClients } from "../Services/OrderService";
import { useAuth } from "../contexts/AuthContext";
import { useOrderFilters } from "../hooks/useOrderFilters";
import { useOrderSort } from "../hooks/useOrderSort";
import "../styles/Cartera.css";
import ExportXLSXButton from "./ExportXLSXButton";
import SelectClient from "./selectClient";
import { useRef } from "react";

export default function OrderBuilded({ showDebtOnly = false }) {
  const auth = useAuth();
  const tipo = auth?.tipo;
  const tableRef = useRef(null);

  const [allOrders, setAllOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Para tipo "A" - Administrador
  const [allClients, setAllClients] = useState([]);
  // Usar card_name (no code) para sincronizar con auth.userSelected - solo para A/S
  const [selectedClient, setSelectedClient] = useState((tipo === "A" || tipo === "S") ? (auth.userSelected || "") : "");

  // Custom Hooks for state management
  const {
    filterDocNum, setFilterDocNum,
    filterTipo, setFilterTipo,
    filterDias, setFilterDias,
    filterTypeEnt, setFilterTypeEnt,
    filterValueEnt, setFilterValueEnt,
    filterTypeVenc, setFilterTypeVenc,
    filterValueVenc, setFilterValueVenc,
  } = useOrderFilters();
  
  const { sortConfig, handleSort } = useOrderSort();

  // Toggle para mostrar/ocultar filtros
  const [isFilterRowVisible, setIsFilterRowVisible] = useState(false);

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
        // Administrador o Supervisor: obtener lista de clientes
        
        // Obtener clientes directamente de la tabla users
        clients = await getAllClients();
        setAllClients(clients);

        
        // Seleccionar el primer cliente por defecto si no hay selección previa (solo para A/S)
        if ((tipo === "A" || tipo === "S") && clients.length > 0 && !selectedClient) {
          const firstClientName = clients[0].name;
          setSelectedClient(firstClientName);
        }
        
      } else {
        // Cliente: obtener solo sus órdenes
        if (auth.cardCode) {
          orders = await getOrders(auth.cardCode);
        } else {
        }
      }
      
      if (!mounted) return;
      
      setAllOrders(orders);
      // Para Admin/Supervisor no apagamos loading aquí; se hará al cargar órdenes del cliente
      if (!(tipo === "A" || tipo === "S")) {
        setIsLoading(false);
      }
    };
    
    if ((tipo === "A" || tipo === "S") || auth.cardCode) {
      loadOrders();
    } else {
    }
    
    return () => {
      mounted = false;
    };
  }, [tipo, auth.cardCode]);

  // Para Admin/Supervisor: cargar órdenes cuando cambia el cliente seleccionado
  useEffect(() => {
    let active = true;
    const fetchOrdersForSelected = async () => {
      if (!(tipo === "A" || tipo === "S")) return;
      if (!selectedClient) return;
      try {
        setIsLoading(true);
        // Convertir card_name (selectedClient) a cardCode
        const client = allClients.find(c => c.name === selectedClient);
        if (!client?.code) {
          setAllOrders([]);
          return;
        }
        const orders = await getOrders(client.code);
        if (!active) return;
        setAllOrders(orders);
      } catch (e) {
        if (!active) return;
        setAllOrders([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };
    fetchOrdersForSelected();
    return () => { active = false; };
  }, [tipo, selectedClient, allClients]);

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
  }, [filterDocNum, filterTipo, filterDias, filterTypeEnt, filterValueEnt, filterTypeVenc, filterValueVenc, allOrders, showDebtOnly, sortConfig, selectedClient, tipo]);

  const applyFilters = () => {
    let query = [...allOrders];

    // Para tipo "A" o "S", filtrar por cliente seleccionado-----------------------------------------
    if ((tipo === "A" || tipo === "S") && selectedClient) {
      // selectedClient ahora contiene card_name, no cardCode
      // Obtener el cardCode del cliente seleccionado
      const selectedClientObj = allClients.find(c => c.name === selectedClient);
      const selectedCardCode = selectedClientObj?.code;
      
      query = query.filter((x) => {
        const match = x.cardCode?.toLowerCase() === selectedCardCode?.toLowerCase();
        return match;
      });
    }


    //FILTRO NUMERO DE DOCUMENTO
    if (filterDocNum.trim() !== "") {
      query = query.filter(
        (x) =>
          (x.folioNum && x.folioNum.toLowerCase().includes(filterDocNum.toLowerCase())) ||
          x.docNum.toString().includes(filterDocNum)
      );
    }

    //FILTRO TIPO DE CLIENTE
    if (filterTipo.trim() !== "") {
      query = query.filter((x) => x.tipoCliente === filterTipo);
    }

    //FILTRO DIAS VENCIDOS (umbral con signo):
    // - Si el input es positivo: muestra valores >= input
    // - Si el input es negativo: muestra valores <= input
    if (filterDias !== null && filterDias !== "") {
      const diasValue = Number(filterDias);
      if (!Number.isNaN(diasValue)) {
        query = query.filter((x) => {
          if (diasValue >= 0) {
            return Number(x.dias_pendientes) >= diasValue;
          }
          return Number(x.dias_pendientes) <= diasValue;
        });
      }
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
    if (o.dias_pendientes >= 0 && o.dias_pendientes < 120) {
      console.log("na");
      return 0;
    }
    console.log(o.docTotal)
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

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <span style={{ marginLeft: "4px", opacity: 0.3 }}>⇅</span>;
    return <span style={{ marginLeft: "4px" }}>{sortConfig.direction === "asc" ? "↑" : "↓"}</span>;
  };

  const title = tipo === "A" || tipo === "S" ? "Monitoreo de Cartera" : (showDebtOnly ? "Deudas Pendientes" : "Estado de Cartera");

  // Vista para administrador/supervisor
  if (tipo === "A" || tipo === "S") {
    return (
      <div className="container-fluid mt-4">
        <div className="d-flex" 
          style={{ display: "flex", flexDirection:"row", marginBottom: "1rem", justifyContent: "space-between", alignItems:"center" }}>
          <div>
            <h3 className="mb-0">{title}</h3>
            <SelectClient
              className="mt-2"
              onChange={({ card_name }) => {
                // Sincronizar directamente con card_name
                setSelectedClient(card_name || "");
              }}
            />
          </div>
          <button
            className=""
            onClick={() => setIsFilterRowVisible(!isFilterRowVisible)}
            title={isFilterRowVisible ? "Ocultar filtros" : "Mostrar filtros"}
          >
            <img src="/data/filter.png" alt="Filtros" style={{ width: "20px", height: "20px" }} />
            {isFilterRowVisible ? "Ocultar" : "Mostrar"}
          </button>
        </div>

        <div
          className="cartera-table-container shadow-sm"
          style={{ border: "1px solid #e6e6e6", maxHeight: "64vh", position: "relative" }}
        >
          <ExportXLSXButton tableRef={tableRef} fileName={`cartera_${selectedClient || auth.cardCode || 'todos'}.xlsx`} sheetName="Cartera" className="descargar" top="11"/>
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
            tipoUser={tipo}
            handleSort={handleSort}
            SortIcon={SortIcon}
            tableRef={tableRef}
          />
          

        </div>
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
          {isFilterRowVisible ? "Ocultar" : "Mostrar"}
        </button>
      </div>

      <div
        className="cartera-table-container shadow-sm"
        style={{ border: "1px solid #e6e6e6", maxHeight: "70vh", position: "relative" }}
      >
        <ExportXLSXButton tableRef={tableRef} fileName={`cartera_${auth.cardCode || 'cliente'}.xlsx`} sheetName="Cartera" className="descargar" top='11' />
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
          tipoUser={tipo}
          handleSort={handleSort}
          SortIcon={SortIcon}
          tableRef={tableRef}
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
    tipoUser,
    handleSort,
    SortIcon,
    tableRef,
  } = props;

  return (
    <table ref={tableRef} className="cartera-table table-hover table-striped align-middle mb-0 text-nowrap">
      <thead className="cartera-table-header sticky-top">
        <tr className="fw-bold text-secondary small text-uppercase">
          <th>Documento</th>
          <th>Fecha Ent.</th>
          <th>Fecha Venc.</th>
          <th className="text-center">Días Venc.</th>
          <th className={tipoUser==="C"? "hidden" : ""}>Tipo</th>
          <th className="text-center text-primary">Total x Cobrar</th>
          <th className="text-center text-danger">Saldo x Vencer</th>
          <th className="text-center bg-white border-start">0-30</th>
          <th className="text-center bg-white">30-60</th>
          <th className="text-center bg-white">60-90</th>
          <th className="text-center bg-white">90-120</th>
          <th className="text-center bg-white">+120</th>
        </tr>
        {isFilterRowVisible && (
          <tr className="filter-row">
            <td>
              <input
                className="form-control "
                style={{ maxWidth: "100px" }}
                value={filterDocNum}
                onChange={(e) => setFilterDocNum(e.target.value)}
                placeholder="FV0001"
              />
            </td>
            <td>
              <div className="d-flex gap-1">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "65px" }}
                  value={filterTypeEnt}
                  onChange={(e) => {
                    setFilterTypeEnt(e.target.value);
                    setFilterValueEnt("");
                  }}
                >
                  <option value="">-</option>
                  <option value="mes">M</option>
                  <option value="semestre">S</option>
                  <option value="año">A</option>
                </select>
                {filterTypeEnt === "mes" && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValueEnt}
                    onChange={(e) => setFilterValueEnt(e.target.value)}
                  >
                    <option value="">Mes</option>
                    <option value="1">Ene</option>
                    <option value="2">Feb</option>
                    <option value="3">Mar</option>
                    <option value="4">Abr</option>
                    <option value="5">May</option>
                    <option value="6">Jun</option>
                    <option value="7">Jul</option>
                    <option value="8">Ago</option>
                    <option value="9">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dic</option>
                  </select>
                )}
                {filterTypeEnt === "semestre" && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValueEnt}
                    onChange={(e) => setFilterValueEnt(e.target.value)}
                  >
                    <option value="">Sem</option>
                    {semesterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                {filterTypeEnt === "año" && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValueEnt}
                    onChange={(e) => setFilterValueEnt(e.target.value)}
                  >
                    <option value="">Año</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            </td>
            <td>
              <div className="d-flex gap-1">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "65px" }}
                  value={filterTypeVenc}
                  onChange={(e) => {
                    setFilterTypeVenc(e.target.value);
                    setFilterValueVenc("");
                  }}
                >
                  <option value="">-</option>
                  <option value="mes">M</option>
                  <option value="semestre">S</option>
                  <option value="año">A</option>
                </select>
                {filterTypeVenc === "mes" && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValueVenc}
                    onChange={(e) => setFilterValueVenc(e.target.value)}
                  >
                    <option value="">Mes</option>
                    <option value="1">Ene</option>
                    <option value="2">Feb</option>
                    <option value="3">Mar</option>
                    <option value="4">Abr</option>
                    <option value="5">May</option>
                    <option value="6">Jun</option>
                    <option value="7">Jul</option>
                    <option value="8">Ago</option>
                    <option value="9">Sep</option>
                    <option value="10">Oct</option>
                    <option value="11">Nov</option>
                    <option value="12">Dic</option>
                  </select>
                )}
                {filterTypeVenc === "semestre" && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValueVenc}
                    onChange={(e) => setFilterValueVenc(e.target.value)}
                  >
                    <option value="">Sem</option>
                    {semesterOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                )}
                {filterTypeVenc === "año" && (
                  <select
                    className="form-select form-select-sm"
                    value={filterValueVenc}
                    onChange={(e) => setFilterValueVenc(e.target.value)}
                  >
                    <option value="">Año</option>
                    {yearOptions.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}
              </div>
            </td>
            <td>
              <input
                className="form-control form-control-sm text-center"
                style={{ width: "90%" }}
                value={filterDias ?? ""}
                onChange={(e) => setFilterDias(e.target.value)}
                placeholder=">días"
                type="number"
              />
            </td>
            <td className={tipoUser==="C" ? "hidden" : ""}>
              <select
                className="form-select form-select-sm"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="LOC">Local</option>
                <option value="EXT">Exterior</option>
              </select>
            </td>
            <td colSpan="7" className="small text-muted fst-italic py-2 pe-3" style={{textAlign: "right"}}>
              Mostrando {filteredOrders.length} registros
            </td>
          </tr>
        )}
      </thead>
      <tbody>
        {isLoading ? (
          <tr>
            <td colSpan="12" className="text-center py-5">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Cargando cartera...</p>
            </td>
          </tr>
        ) : filteredOrders.length === 0 ? (
          <tr>
            <td colSpan="12" className="text-center py-4 text-muted">
              No se encontraron registros.
            </td>
          </tr>
        ) : (
          <>
            {filteredOrders.map((o) => (
              <tr key={o.docNum}>
                <td className="fw-bold flex-vertical">
                  {o.folioNum} <small className="text-muted d-block">{o.docNum}</small>
                </td>
                <td>{o.docDate ? new Date(o.docDate).toLocaleDateString() : ""}</td>
                <td>{o.docDueDate ? new Date(o.docDueDate).toLocaleDateString() : ""}</td>
                <td className="text-center">
                  <span className={`badge ${getBadgeClass(o.dias_pendientes)}`}>
                    {o.dias_pendientes}
                  </span>
                </td>
                <td className={tipoUser==="C"? "hidden" : ""}>{o.tipoCliente}</td>
                <td className="text-center fw-bold">{formatUSD(o.docTotal)}</td>
                <td className="text-center text-danger fw-bold">{formatUSD(getSaldoPorVencer(o))}</td>
                <td className="text-center border-start text-muted">
                  {getMontoRangoValue(o, 0, 30) ? formatUSD(getMontoRangoValue(o, 0, 30)) : "-"}
                </td>
                <td className="text-center text-muted">
                  {getMontoRangoValue(o, 30, 60) ? formatUSD(getMontoRangoValue(o, 30, 60)) : "-"}
                </td>
                <td className="text-center text-muted">
                  {getMontoRangoValue(o, 60, 90) ? formatUSD(getMontoRangoValue(o, 60, 90)) : "-"}
                </td>
                <td className="text-center text-muted">
                  {getMontoRangoValue(o, 90, 120) ? formatUSD(getMontoRangoValue(o, 90, 120)) : "-"}
                </td>
                <td className="text-center text-muted">
                  {getMontoRangoValue(o, 120, 9999) ? formatUSD(getMontoRangoValue(o, 120, 9999)) : "-"}
                </td>
              </tr>
            ))}
            <tr className="cartera-table-active fw-bold border-top border-2 border-secondary sticky-bottom">
              <td colSpan={tipoUser === "C" ? 4 : 5} className="text-center">TOTALES:</td>
              <td className="text-center text-primary">{formatUSD(totals.total)}</td>
              <td className="text-center text-danger">{formatUSD(totals.saldo)}</td>
              <td className="text-center border-start text-muted">{formatUSD(totals.r0_30)}</td>
              <td className="text-center text-muted">{formatUSD(totals.r30_60)}</td>
              <td className="text-center text-muted">{formatUSD(totals.r60_90)}</td>
              <td className="text-center text-muted">{formatUSD(totals.r90_120)}</td>
              <td className="text-center text-muted">{formatUSD(totals.r120)}</td>
            </tr>
            <tr className="cartera-table-active fw-bold border-top border-2 border-secondary">
              <td colSpan={tipoUser === "C" ? 4 : 5} className="text-center">Vencimiento (%)</td>
              <td className="text-center text-primary">100%</td>
              <td className="text-center text-danger">{pct(totals.saldo, totals.total)}</td>
              <td className="text-center border-start text-muted">{pct(totals.r0_30, totals.total)}</td>
              <td className="text-center text-muted">{pct(totals.r30_60, totals.total)}</td>
              <td className="text-center text-muted">{pct(totals.r60_90, totals.total)}</td>
              <td className="text-center text-muted">{pct(totals.r90_120, totals.total)}</td>
              <td className="text-center text-muted">{pct(totals.r120, totals.total)}</td>
            </tr>
          </>
        )}
      </tbody>
    </table>
  );
}
