/**
 * PODetalle - Tabla de producción y envío con filtros por fecha
 * Agrupa por nombreitem, muestra cantidades por semana
 * Filtros: Semanas, Mes, Rango de fechas
 */
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { getPedidos } from '../Services/OrderService';
import { useAuth } from '../contexts/AuthContext';
import ExportXLSXButton from './ExportXLSXButton';

export default function PODetalle({ pedidos: pedidosProp, cardName }) {
  const auth = useAuth();
  const tableRef = useRef(null);
  const [allPedidos, setAllPedidos] = useState([]);
  const [loading, setLoading] = useState(false);
  // Nota: cuando se reciben pedidos por props (A/S), evitamos manejar clientes aquí
  
  // Estados de filtros
  const [filterType, setFilterType] = useState('mes'); // 'semanas', 'mes', 'rango'
  const [selectedWeeks, setSelectedWeeks] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedPO, setSelectedPO] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Consumir pedidos desde props si están disponibles (vista A/S).
  useEffect(() => {
    if (pedidosProp && pedidosProp.length > 0) {
      setAllPedidos(pedidosProp);
      const primerPedido = pedidosProp[0];
      const fecha = primerPedido.getDate?.();
      if (fecha) {
        setSelectedMonth((fecha.getMonth() + 1).toString().padStart(2, '0'));
        setSelectedYear(fecha.getFullYear());
      }
    }
  }, [pedidosProp, cardName]);

  // Fallback: cargar pedidos del cliente autenticado (vista Cliente)
  useEffect(() => {
    if (pedidosProp && pedidosProp.length > 0) return; // Si vienen por props, no fetch
    const loadPedidos = async () => {
      setLoading(true);
      try {
        const pedidos = await getPedidos(auth.cardName);
        setAllPedidos(pedidos || []);
        if (pedidos && pedidos.length > 0) {
          const primerPedido = pedidos[0];
          const fecha = primerPedido.getDate?.();
          if (fecha) {
            setSelectedMonth((fecha.getMonth() + 1).toString().padStart(2, '0'));
            setSelectedYear(fecha.getFullYear());
          }
        }
      } catch (error) {
        console.error('❌ Error cargando pedidos:', error);
        setAllPedidos([]);
      } finally {
        setLoading(false);
      }
    };
    if (auth.cardName) {
      loadPedidos();
    }
  }, [auth.cardName, pedidosProp]);

  // Obtener semanas y meses disponibles
  const semanasDisponibles = useMemo(() => {
    const semanas = new Set();
    allPedidos.forEach(p => {
      const week = p.getWeekNumber?.();
      if (week) semanas.add(week);
    });
    return Array.from(semanas).sort((a, b) => a - b);
  }, [allPedidos]);

  const mesesDisponibles = useMemo(() => {
    const meses = new Set();
    allPedidos.forEach(p => {
      const date = p.getDate?.();
      if (date) {
        meses.add(`${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`);
      }
    });
    return Array.from(meses)
      .sort()
      .map((mes) => {
        const [year, month] = mes.split('-');
        const nombreMes = new Date(parseInt(year), parseInt(month) - 1, 1).toLocaleString('es-EC', { month: 'long' });
        return {
          value: month,
          year: parseInt(year),
          label: `${nombreMes}`
        };
      });
  }, [allPedidos]);

  // Mantener el selectedMonth coherente cuando cambia el año
  useEffect(() => {
    if (filterType !== 'mes') return;
    const mesesDelAño = mesesDisponibles.filter(m => m.year === selectedYear);
    if (mesesDelAño.length === 0) {
      // No hay meses para este año, limpiar selección
      setSelectedMonth('');
      return;
    }
    const existeMesActual = mesesDelAño.some(m => m.value === selectedMonth);
    if (!existeMesActual) {
      // Ajustar al primer mes disponible del año seleccionado
      setSelectedMonth(mesesDelAño[0].value);
    }
  }, [selectedYear, mesesDisponibles, filterType]);

  // Obtener POs disponibles
  const posDisponibles = useMemo(() => {
    const pos = new Set();
    allPedidos.forEach(p => {
      if (p.po) pos.add(p.po);
    });
    return Array.from(pos).sort();
  }, [allPedidos]);

  // Filtrar pedidos según el tipo de filtro seleccionado
  const datosFiltrados = useMemo(() => {
    // console.log('🔍 Aplicando filtro:', { 
    //   filterType, 
    //   selectedWeeks, 
    //   selectedMonth, 
    //   selectedYear, 
    //   selectedPO,
    //   dateFrom, 
    //   dateTo,
    //   totalPedidos: allPedidos.length 
    // });
    
    const filtrados = allPedidos.filter(p => {
      const date = p.getDate?.();
      if (!date) return false;

      switch (filterType) {
        case 'semanas':
          if (selectedWeeks.length === 0) return true;
          const week = p.getWeekNumber?.();
          return week && selectedWeeks.includes(week.toString());

        case 'mes':
          if (!selectedMonth || !selectedYear) return true;
          const mesCoincide = date.getFullYear() === selectedYear && 
                 (date.getMonth() + 1) === parseInt(selectedMonth);
          return mesCoincide;

        case 'PO':
          if (!selectedPO) return true;
          return (p.po || '').toLowerCase() === selectedPO.toLowerCase();
            
        // case 'rango':
        //   if (!dateFrom || !dateTo) return true;
        //   const from = new Date(dateFrom);
        //   const to = new Date(dateTo);
        //   return date >= from && date <= to;

        default:
          return true;
      }
      
    });
    return filtrados;
  }, [allPedidos, filterType, selectedWeeks, selectedMonth, selectedYear, selectedPO, dateFrom, dateTo]);

  
  // Calcular semanas dinámicamente
  const semanas = useMemo(() => {
    const semanasUniques = new Set();
    datosFiltrados.forEach(p => {
      const week = typeof p.getWeekNumber === 'function' ? p.getWeekNumber?.() : null;
      if (week) semanasUniques.add(week);
    });
    return Array.from(semanasUniques).sort((a, b) => a - b);
  }, [datosFiltrados]);

  // Agrupar por nombreitem
    const datosAgrupados = useMemo(() => {
        const agrupados = {};
        
        datosFiltrados.forEach(pedido => {
            const item = pedido.nombreitem || 'SIN NOMBRE';
            if (!agrupados[item]) {
                agrupados[item] = {
                    nombreitem: item,
                    lineaproducto: pedido.lineaproducto, // ¡IMPORTANTE: Guardar esto para los reduce!
                    semanas: {},
                    totalGeneral: 0,
                    quantitybaseTotal: 0,
                    kilos: 0,
                    kilospendientes: 0,
                    presentacion: pedido.presentacion || "",
                    totallineasd: 0,
                    preciounitario: 0,
                    productos: 0,
                    psnacks:0,
                    pcongelados:0
                };
            }
            const week = typeof pedido.getWeekNumber === 'function' ? pedido.getWeekNumber() : 0;
            const qty = parseFloat(pedido.cantidad) || 0;
            const qtyPendiente = parseFloat(pedido.cantidadpendiente) || 0;
            const kilos = parseFloat(pedido.kilos) || 0;
            const kilosPend = parseFloat(pedido.kilospendientes) || 0;
            const totalLinea = parseFloat(pedido.totallineasd) || 0;
            const precioUnit = parseFloat(pedido.preciounitario) || 0;
            const productos= 1
            const psnacks_= pedido.lineanegocio==="SNACK" ? 1 : 0;
            const pcongelados_= pedido.lineanegocio?.toLowerCase().includes('congelados') ? 1 : 0;
            if (!agrupados[item].semanas[week]) {
            agrupados[item].semanas[week] = 0;
            }

            agrupados[item].semanas[week] += qty;
            agrupados[item].totalGeneral += qty;
            agrupados[item].quantitybaseTotal += qtyPendiente;
            agrupados[item].kilos += kilos;
            agrupados[item].kilospendientes += kilosPend;
            agrupados[item].totallineasd += totalLinea;
            agrupados[item].preciounitario = precioUnit;
            agrupados[item].productos += productos;
            agrupados[item].psnacks += psnacks_;
            agrupados[item].pcongelados += pcongelados_;
        });

    return Object.values(agrupados);
    }, [datosFiltrados]);

    // 2. Cálculos derivados (usando el return correcto)
    const productosTotal= datosAgrupados.reduce((sum, item) => {
        return sum + item.productos;
    }, 0);
    const snacks = datosAgrupados.reduce((sum, item) => {
        return item.psnacks? sum + 1 : sum;
    }, 0); // Importante el valor inicial 0
    console.log(`[DEBUG] ${snacks}`);
    const congelados = datosAgrupados.reduce((sum, item) => {
    return item.pcongelados? sum + 1 : sum;
    }, 0);
    const presentacionesUnicas = [...new Set(
      datosAgrupados
        .map(item => item.presentacion)
        .filter(p => p != null && p !== '') // Elimina null, undefined y strings vacíos
    )
];

  // Calcular totales por semana
  const totalesPorSemana = useMemo(() => {
    const totales = {};
    semanas.forEach(s => totales[s] = 0);

    datosAgrupados.forEach(item => {
      semanas.forEach(s => {
        totales[s] += item.semanas[s] || 0;
      });
    });

    return totales;
  }, [datosAgrupados, semanas]);

  // Calcular fechas de despacho por semana
  const fechasDespacho = useMemo(() => {
    const fechas = {};
    
    semanas.forEach(week => {
      const pedidoEnSemana = datosFiltrados.find(p => p.getWeekNumber?.() === week);
      if (pedidoEnSemana && pedidoEnSemana.fechapedido) {
        const date = pedidoEnSemana.getDate?.();
        if (date) {
          fechas[week] = date.toLocaleDateString('es-EC');
        }
      }
    });

    return fechas;
  }, [semanas, datosFiltrados]);

  const formatNum = (num) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (loading) {
    return <div className="alert alert-info">Cargando pedidos...</div>;
  }

  if (allPedidos.length === 0) {
    return <div className="alert alert-warning">No hay pedidos para mostrar</div>;
  }

  return (
    <div className="po-detalle">
      {/* Filtros de Fecha */}
      <div className="selector-po">
        <div className="row align-items-end g-3 filter_PedidoDetalle">
          {/* Tipo de Filtro */}
          <div className="col-md-3">
            <label htmlFor="filterType" className="form-label fw-bold text-secondary">
              <i className="bi bi-funnel"></i>
            </label>
            <select 
              id="filterType"
              className="form-select"
              value={filterType}
              onChange={(e) => {
                setFilterType(e.target.value);
                // Resetear filtros al cambiar tipo
                setSelectedWeeks([]);
                setSelectedPO('');
                setDateFrom('');
                setDateTo('');
              }}
            >
              <option value= "PO">Por PO</option>
              <option value="semanas">Por Semanas</option>
              <option value="mes">Por Mes</option>
              {/* <option value="rango">Por Rango de Fechas</option> */}
            </select>
          </div>

          {filterType === 'PO' && (
            <div className="col-md-9">
              <label htmlFor="poSelect" className="form-label fw-bold text-secondary">
                <i className="bi bi-tag"></i>
              </label>
              <select
                id="poSelect"
                className="form-select"
                value={selectedPO}
                onChange={(e) => setSelectedPO(e.target.value)}
              >
                <option value="">Todas</option>
                {posDisponibles.map((po) => (
                  <option key={po} value={po}>
                    {po}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtros Dinámicos según tipo */}
          {filterType === 'semanas' && (
            <div className="col-md-9">
              <label htmlFor="weekSelect" className="form-label fw-bold text-secondary">
                <i className="bi bi-calendar-week"></i>
              </label>
              <select
                id="weekSelect"
                className="form-select"
                multiple
                size="3"
                value={selectedWeeks}
                onChange={(e) => {
                  const options = Array.from(e.target.selectedOptions, option => option.value);
                  setSelectedWeeks(options);
                }}
              >
                <option value="" disabled></option>
                {semanasDisponibles.map(week => (
                  <option key={week} value={week}>
                    Semana {week}
                  </option>
                ))}
              </select>
              <small className="text-muted">Ctrl+Click para seleccionar varias semanas. Deja vacío para ver todas.</small>
            </div>
          )}

          {filterType === 'mes' && (
            <>
              <div className="col-md-3" style={{whiteSpace: "nowrap"}}>
                <label htmlFor="monthSelect" className="form-label fw-bold text-secondary">
                  <i className="bi bi-calendar-month"></i>
                </label>
                <select
                  id="monthSelect"
                  className="form-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                    {mesesDisponibles
                      .filter(mes => mes.year === selectedYear)
                      .map(mes => (
                        <option key={`${mes.year}-${mes.value}`} value={mes.value}>{mes.label}</option>
                      ))}
                </select>
              </div>

              {/*Filtro año */}
              <div className="col-md-3">
                <label htmlFor="yearSelect" className="form-label fw-bold text-secondary">
                  <i className="bi bi-calendar"></i>
                </label>
                <select
                  id="yearSelect"
                  className="form-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                >
                  {
                    Array.from(new Set(mesesDisponibles.map(m => m.year))).sort().map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))
                  }
                </select>
              </div>
            </>
          )}



          {filterType === 'rango' && (
            <>
              <div className="col-md-4">
                <label htmlFor="dateFrom" className="form-label fw-bold text-secondary">
                  <i className="bi bi-calendar-range"></i> Desde
                </label>
                <input
                  type="date"
                  id="dateFrom"
                  className="form-control"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="col-md-5">
                <label htmlFor="dateTo" className="form-label fw-bold text-secondary">
                  <i className="bi bi-calendar-range"></i> Hasta
                </label>
                <input
                  type="date"
                  id="dateTo"
                  className="form-control"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Información del Filtro Aplicado */}
      <div className="info-po">
        <h5 className="text-primary fw-bold mb-2">
          <i className="bi bi-funnel-fill"></i> Filtro: {
            filterType === 'semanas' ? `Semanas ${selectedWeeks.length > 0 ? selectedWeeks.join(', ') : 'Todas'}` :
            filterType === 'mes' ? `${['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][parseInt(selectedMonth)-1] || ''} ${selectedYear}` :
            filterType === 'PO' ? `PO ${selectedPO || 'Todas'}` :
            dateFrom && dateTo ? `${dateFrom} a ${dateTo}` : 'Rango no definido'
          }
        </h5>
        <div className="row small text-muted">
          <div className="col-md-2">
            <strong>Productos distintos:</strong> <span className="badge bg-info">{datosAgrupados.length}</span> 
            <strong>Presentaciones distintas:</strong> <span className="badge bg-info">{presentacionesUnicas.length}</span> 
          </div>
          <div className="col-md-2">
            <strong>Pedidos:</strong> <span className="badge bg-info">{formatNum(productosTotal)}</span>
            <strong>Snacks:</strong> <span className="badge bg-info">{formatNum(snacks)}</span>
            <strong>Congelados:</strong> <span className="badge bg-info">{formatNum(congelados)}</span>
          </div>
          <div className="col-md-2">
            <strong>Semanas:</strong> <span className="badge bg-info">{semanas.length > 0 ? `${Math.min(...semanas)}, ${Math.max(...semanas)}` : 'N/A'}</span>
          </div>
          <div className="col-md-2">
            <strong>POs:</strong> <span className="badge bg-info">{new Set(datosFiltrados.map(p => p.po)).size}</span>
          </div>
        </div>
      </div>

      {/* Tabla de Detalle */}
      <div className=" table-responsive shadow-sm mb-4" style={{ borderRadius: '8px', border: '1px solid #d5e5f5ff', position: 'relative' }}>
        <ExportXLSXButton tableRef={tableRef} fileName={`podetalle_${cardName || auth.cardName || 'cliente'}.xlsx`} sheetName="PODetalle" className="descargar" top='4' />
        <table ref={tableRef} className="detalle-table table-sm table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr className="fw-bold text-secondary text-uppercase small">
              {/* Columna PO solo si filtro semanas, mes o PO=Todas */}
              {((filterType === 'semanas' || filterType === 'mes') || (filterType === 'PO' && !selectedPO)) && (
                <th style={{ minWidth: '90px' }}>PO</th>
              )}
              <th style={{ minWidth: '200px' }}>Producto</th>
              {semanas.map(s => (
                <th key={s} className="text-center" style={{ minWidth: '80px', backgroundColor: 'rgb(217 233 247)' }}>
                  <div className="fw-bold">Sem {s}</div>
                </th>
              ))}
              <th className="text-center" style={{ minWidth: '75px' }}>Kilos</th>
              <th className="text-center" style={{ minWidth: '75px' }}>Kilos Pend</th>
              <th className={`text-center ${auth.tipo==="C"? "hidden" : ""}`} style={{ minWidth: '100px' }}>Total USD</th>
              <th className="text-center text-primary fw-bold" style={{ minWidth: '90px' }}>Total Unid</th>
            </tr>
            <tr className="small text-muted" style={{ backgroundColor: '#fafafa' }}>
              {((filterType === 'semanas' || filterType === 'mes') || (filterType === 'PO' && !selectedPO)) && (
                <td></td>
              )}
              <td></td>
              {semanas.map(s => (
                <td key={`date-${s}`} className="text-center" style={{ fontSize: '0.80rem', fontStyle: 'italic' }}>
                  {fechasDespacho[s] || '-'}
                </td>
              ))}
              <td></td>
              <td></td>
              <td></td>
              <td></td>
            </tr>
          </thead>
          <tbody>
            {datosAgrupados.length === 0 ? (
              <tr>
                <td colSpan={1 + semanas.length + (auth.tipo === "C" ? 3 : 4) + (((filterType === 'semanas' || filterType === 'mes') || (filterType === 'PO' && !selectedPO)) ? 1 : 0)} className="text-center text-muted py-4">
                  No se encontraron pedidos con los filtros seleccionados.
                </td>
              </tr>
            ) : (
              <>
                {/* Agrupar por PO si corresponde */}
                {((filterType === 'semanas' || filterType === 'mes') || (filterType === 'PO' && !selectedPO)) ?
                  // Agrupar por PO, mostrar PO solo una vez usando rowSpan
                  Array.from(new Set(datosFiltrados.map(p => p.po))).map(po => {
                    const itemsPO = datosAgrupados.filter(item => {
                      // Buscar si algún pedido de este item tiene ese PO
                      return datosFiltrados.find(p => p.po === po && p.nombreitem === item.nombreitem);
                    });
                    return itemsPO.map((item, idx) => (
                      <tr
                        key={po + '-' + idx}
                        className={idx % 2 === 0 ? 'bg-white' : 'bg-light'}
                        style={{ borderBottom: '2px solid #e0e7ef' }}
                      >
                        {idx === 0 && (
                          <td
                            className="fw-bold text-primary text-center align-middle border-bottom"
                            rowSpan={itemsPO.length}
                            style={{ backgroundColor: 'rgb(250 250 250)' }}
                          >
                            {po}
                          </td>
                        )}
                        <td className="fw-bold text-dark">{item.nombreitem}</td>
                        {semanas.map(s => (
                          <td key={`${idx}-${s}`} className="text-center">
                            <span className={item.semanas[s] ? 'badge bg-info' : ''}>
                              {formatNum(item.semanas[s] || '-')}
                            </span>
                          </td>
                        ))}
                        <td className="text-center text-muted">{formatNum(item.kilos)}</td>
                        <td className="text-center text-muted">{formatNum(item.kilospendientes)}</td>
                        <td className={`text-center ${auth.tipo==="C"? "hidden" : ""}`} title={`Precio unitario: $${item.preciounitario?.toFixed(2) || '0.00'}`} style={{ cursor: 'help' }}>
                          <span className="fw-bold text-success">${item.totallineasd?.toFixed(2) || '0.00'}</span>
                        </td>
                        <td className="text-center fw-bold text-primary">
                          {formatNum(item.totalGeneral)}
                        </td>
                      </tr>
                    ));
                  })
                  :
                  // No mostrar columna PO, solo filas normales
                  datosAgrupados.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-light'}>
                      <td className="fw-bold text-dark">{item.nombreitem}</td>
                      {semanas.map(s => (
                        <td key={`${idx}-${s}`} className="text-center">
                          <span className={item.semanas[s] ? 'badge bg-info' : ''}>
                            {formatNum(item.semanas[s] || '-')}
                          </span>
                        </td>
                      ))}
                      <td className="text-center text-muted">{formatNum(item.kilos)}</td>
                      <td className="text-center text-muted">{formatNum(item.kilospendientes)}</td>
                      <td className={`text-center ${auth.tipo==="C"? "hidden" : ""}`} title={`Precio unitario: $${item.preciounitario?.toFixed(2) || '0.00'}`} style={{ cursor: 'help' }}>
                        <span className="fw-bold text-success">${item.totallineasd?.toFixed(2) || '0.00'}</span>
                      </td>
                      <td className="text-center fw-bold text-primary">
                        {formatNum(item.totalGeneral)}
                      </td>
                    </tr>
                  ))
                }
                {/* Fila de totales */}
                <tr className="fw-bold border-top-3 border-secondary totales" style={{ backgroundColor: '#f8f9fa' }}>
                  {((filterType === 'semanas' || filterType === 'mes') || (filterType === 'PO' && !selectedPO)) && <td></td>}
                  <td className="text-dark">TOTALES</td>
                  {semanas.map(s => (
                    <td key={`total-${s}`} className="text-center text-primary fw-bold">
                      {formatNum(totalesPorSemana[s])}
                    </td>
                  ))}
                  <td className="text-center text-primary fw-bold">
                    {formatNum(datosAgrupados.reduce((sum, item) => sum + item.kilos, 0))}
                  </td>
                  <td className="text-center text-primary fw-bold">
                    {formatNum(datosAgrupados.reduce((sum, item) => sum + item.kilospendientes, 0))}
                  </td>
                  <td className={`text-center text-success fw-bold ${auth.tipo==="C"? "hidden" : ""}`}>
                    ${datosAgrupados.reduce((sum, item) => sum + item.totallineasd, 0).toFixed(2)}
                  </td>
                  <td className="text-center text-primary fw-bold" style={{ fontSize: '1.1rem' }}>
                    {formatNum(Object.values(totalesPorSemana).reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen de información */}
      <div className="cards-resumen">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="card-title text-secondary fw-bold mb-3">
              <i className="bi bi-box"></i> Resumen de Producción
            </h6>
            <div className="row">
              <div className="col-6">
                <small className="text-muted">Total Unidades</small>
                <div className="h5 fw-bold text-primary">
                  {formatNum(datosAgrupados.reduce((sum, item) => sum + item.totalGeneral, 0))}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <h6 className="card-title text-secondary fw-bold mb-3">
              <i className="bi bi-calendar"></i> Cronograma
            </h6>
            <div className="row">
              <div className="col-6">
                <small className="text-muted">Semanas Cubiertas</small>
                <div className="h5 fw-bold text-info">
                  {semanas.length > 0 ? `${Math.min(...semanas)} - ${Math.max(...semanas)}` : 'N/A'}
                </div>
              </div>
              <div className="col-6">
                <small className="text-muted">Productos Diferentes</small>
                <div className="h5 fw-bold text-warning">
                  {datosAgrupados.length}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
