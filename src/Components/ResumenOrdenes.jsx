/**
 * ResumenOrdenes - Tabla de resumen de órdenes estilo IBERIA PLANTAIN CHIPS
 * Agrupa por PO, muestra columnas dinámicas por producto
 * Incluye ETD, ETA, Expected Delivery, GAP, Estatus
 */
import { useMemo, useRef } from 'react';
import ExportXLSXButton from './ExportXLSXButton';

export default function ResumenOrdenes({ pedidos = [] }) {
  console.log('🔍 ResumenOrdenes: Recibiendo pedidos:', pedidos);
  const tableRef = useRef(null);
  
  // Obtener productos únicos
  const productosUnicos = useMemo(() => {
    const productos = new Set();
    pedidos.forEach(p => {
      if (p.nombreitem) {
        productos.add(p.nombreitem);
      }
    });
    const resultado = Array.from(productos).sort();
    console.log('🔍 ProductosUnicos:', resultado);
    return resultado;
  }, [pedidos]);

  // Agrupar por PO
  const ordenesAgrupadas = useMemo(() => {
    const agrupadas = {};

    pedidos.forEach(pedido => {
      const po = pedido.po || 'SIN PO';
      if (!agrupadas[po]) {
        agrupadas[po] = {
          po,
          incoterm: 'CIF',
          destino: pedido.destino || '-',
          semana: typeof pedido.getWeekNumber === 'function' ? pedido.getWeekNumber?.() : '-',
          naviera: pedido.empventas || '-',
          puertoDestino: pedido.puertodestino || '-',
          productos: {},
          fechapedido: typeof pedido.getDate === 'function' ? pedido.getDate?.() : null,
          fechaexpected: typeof pedido.getExpectedDate === 'function' ? pedido.getExpectedDate?.() : null,
          items: []
        };
      }

      const item = pedido.nombreitem || 'SIN NOMBRE';
      const qty = parseFloat(pedido.cantidad) || 0;

      if (!agrupadas[po].productos[item]) {
        agrupadas[po].productos[item] = 0;
      }
      agrupadas[po].productos[item] += qty;
      agrupadas[po].items.push(pedido);
    });

    const resultado = Object.values(agrupadas).sort((a, b) => a.po.localeCompare(b.po));
    console.log('🔍 OrdenesAgrupadas:', resultado);
    return resultado;
  }, [pedidos]);

  // Calcular fechas usando datos de la DB
  const calcularFechas = (fechapedido, fechaexpected) => {
    if (!fechapedido) return { etd: '-', etaPort: '-', etaWarehouse: '-', expectedDelivery: '-', gap: '-' };
    console.log(`Fechas ingresadas: ${fechapedido} / ${fechaexpected}`);
    const etd = fechapedido;
    const expectedDelivery = fechaexpected;

    // GAP: diferencia en días entre ETD y Expected Delivery
    let gap = '-';
    if (expectedDelivery && etd) {
    const MS_PER_DAY = 1000 * 60 * 60 * 24;

    // 1. Clonamos las fechas para no modificar las originales y las ponemos a medianoche
    const inicio = new Date(etd).setHours(0, 0, 0, 0);
    const entrega = new Date(expectedDelivery).setHours(0, 0, 0, 0);
    const hoy= new Date();
s
    // 2. Operación simple: (Destino - Inicio) / Milisegundos de un día
    gap = Math.round((entrega - hoy) / MS_PER_DAY);
    }

    return {
      etd: etd.toLocaleDateString('es-EC'),
      etaPort: '-',
      etaWarehouse: '-',
      expectedDelivery: expectedDelivery ? expectedDelivery.toLocaleDateString('es-EC') : '-',
      gap: gap
    };
  };

  // Calcular estatus basado en fechapedido
  const calcularEstatus = (fechapedido) => {
    if (!fechapedido) return 'PENDIENTE';
    const hoy = new Date();
    const fecha = fechapedido;
    if (fecha < hoy) return 'ENVIADO';
    if (fecha <= new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'PROXIMO';
    return 'PROGRAMADO';
  };

  // Totales por producto
  const totalesPorProducto = useMemo(() => {
    const totales = {};
    productosUnicos.forEach(producto => {
      totales[producto] = 0;
    });

    ordenesAgrupadas.forEach(orden => {
      productosUnicos.forEach(producto => {
        totales[producto] += orden.productos[producto] || 0;
      });
    });

    return totales;
  }, [productosUnicos, ordenesAgrupadas]);

  const formatNum = (num) => {
    if (num === null || num === undefined || num === 0) return '-';
    return num.toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const getEstadoColor = (estatus) => {
    switch (estatus) {
      case 'ENVIADO':
        return 'badge bg-success';
      case 'PROXIMO':
        return 'badge bg-warning';
      case 'PROGRAMADO':
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  };

  if (pedidos.length === 0) {
    return <div className="alert alert-info">No hay órdenes para mostrar</div>;
  }

  return (
    <div className="resumen-ordenes">
      {/* Header */}
      

      <div className="table-responsive shadow-sm mb-4" style={{ borderRadius: '8px', border: '1px solid #dee2e6', overflowX: 'auto', position: 'relative' }}>
        <ExportXLSXButton tableRef={tableRef} fileName={`resumen_ordenes.xlsx`} sheetName="Resumen" className="descargar" top='5' />
        <table ref={tableRef} className="table table-sm table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr className="fw-bold text-secondary text-uppercase small">
              <th style={{ minWidth: '80px' }}>PO</th>
              <th style={{ minWidth: '80px' }}>Incoterm</th>
              <th style={{ minWidth: '120px' }}>Destino</th>
              <th style={{ minWidth: '80px' }}>Semana</th>
              <th style={{ minWidth: '120px' }}>Naviera</th>
              <th style={{ minWidth: '120px' }}>Puerto Destino</th>
              
              <th style={{ minWidth: '90px' }}>ETD</th>
              <th style={{ minWidth: '90px' }}>ETA Port</th>
              <th style={{ minWidth: '120px' }}>ETA Warehouse</th>
              <th style={{ minWidth: '120px' }}>Expected Delivery</th>
              <th style={{ minWidth: '60px' }}>GAP</th>
              <th style={{ minWidth: '100px' }}>Estatus</th>
            </tr>
          </thead>
          <tbody>
            {ordenesAgrupadas.map((orden) => {
              const fechas = calcularFechas(orden.fechapedido, orden.fechaexpected);
              const estatus = calcularEstatus(orden.fechapedido);

              return (
                <tr key={orden.po}>
                  <td className="fw-bold text-primary">{orden.po}</td>
                  <td>{orden.incoterm}</td>
                  <td className="small">{orden.destino}</td>
                  <td className="text-center">{orden.semana}</td>
                  <td className="small">{orden.naviera}</td>
                  <td className="small">{orden.puertoDestino}</td>
                  <td className="small text-center">{fechas.etd}</td>
                  <td className="small text-center">{fechas.etaPort}</td>
                  <td className="small text-center">{fechas.etaWarehouse}</td>
                  <td className="small text-center">{fechas.expectedDelivery}</td>
                  <td className={`text-center fw-bold ${fechas.gap > 0 ? 'text-danger' : 'text-pass'}`}>{fechas.gap}</td>
                  <td className="text-center">
                    <span className={getEstadoColor(estatus)}>{estatus}</span>
                  </td>
                </tr>
              );
            })}

            {/* Fila de totales */}
            <tr className="table-active fw-bold border-top border-2 border-secondary">
              <td colSpan="5" className="text-center text-muted">
                ({ordenesAgrupadas.length} órdenes)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resumen de información */}
      <div className="cards-summary">
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-receipt"></i> Total Órdenes
            </small>
            <h5 className="text-primary fw-bold mb-0">{ordenesAgrupadas.length}</h5>
          </div>
        </div>
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-box"></i> Productos
            </small>
            <h5 className="text-success fw-bold mb-0">{productosUnicos.length}</h5>
          </div>
        </div>
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-bag"></i> Total Unidades
            </small>
            <h5 className="text-info fw-bold mb-0">{formatNum(
              Object.values(totalesPorProducto).reduce((a, b) => a + b, 0)
            )}</h5>
          </div>
        </div>
        <div className="card border-0 shadow-sm h-100">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-arrow-repeat"></i> Promedio/PO
            </small>
            <h5 className="text-warning fw-bold mb-0">{formatNum(
              Object.values(totalesPorProducto).reduce((a, b) => a + b, 0) / ordenesAgrupadas.length
            )}</h5>
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="leyenda">
        <span className="badge bg-success me-2">ENVIADO</span>
        <span className="badge bg-warning me-2">PRÓXIMO</span>
        <span className="badge bg-info me-2">PROGRAMADO</span>
        <span className="badge bg-secondary">PENDIENTE</span>
        <span className="ms-3 text-muted">| GAP = Días entre ETA Port y Expected Delivery</span>
      </div>
    </div>
  );
}
