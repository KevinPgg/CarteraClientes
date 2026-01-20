/**
 * POList - Tabla de múltiples POs estilo HOLPECA
 * Agrupa por PO y muestra resumen por orden
 */
import React, { useMemo, useRef } from 'react';
import ExportXLSXButton from './ExportXLSXButton';

export default function POList({ pedidos = [] }) {
  console.log('🔍 POList: Recibiendo pedidos:', pedidos);
  const tableRef = useRef(null);
  
  // Agrupar por PO
  const pedidosAgrupados = useMemo(() => {
    const agrupados = {};

    pedidos.forEach(pedido => {
      const po = pedido.po || 'SIN PO';
      if (!agrupados[po]) {
        agrupados[po] = {
          po,
          items: [],
          totalUnidades: 0,
          totalKilos:0,
          totalFactura: 0,
          cliente: pedido.cliente,
          empventas: pedido.empventas
        };
      }

      const qty = parseFloat(pedido.cantidad) || 0;
      const total = parseFloat(pedido.totallineasd) || 0;

      agrupados[po].items.push(pedido);
      agrupados[po].totalUnidades += qty;
      agrupados[po].totalKilos += parseFloat(pedido.kilos) || 0;
      agrupados[po].totalFactura += total;
    });

    const resultado = Object.values(agrupados).sort((a, b) => a.po.localeCompare(b.po));
    console.log('🔍 POList agrupados:', resultado);
    return resultado;
  }, [pedidos]);

  // Calcular totales generales
  const totalesGenerales = useMemo(() => {
    return {
      totalUnidades: pedidosAgrupados.reduce((sum, po) => sum + po.totalUnidades, 0),
      totalFactura: pedidosAgrupados.reduce((sum, po) => sum + po.totalFactura, 0),
      totalKilos: pedidosAgrupados.reduce((sum, po) => sum + po.totalKilos, 0),
      totalPOs: pedidosAgrupados.length
    };
  }, [pedidosAgrupados]);

  const formatUSD = (value) =>
    value.toLocaleString('es-EC', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const formatNum = (num) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('es-EC', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  if (pedidos.length === 0) {
    return <div className="alert alert-info">No hay pedidos para mostrar</div>;
  }

  return (
    <div className="po-list">
      {/* Header */}
 
      <div className="table-responsive shadow-sm mb-4" style={{ borderRadius: '8px', border: '1px solid #dee2e6', position: 'relative' }}>
        <ExportXLSXButton tableRef={tableRef} fileName={`polist.xlsx`} sheetName="POList" className="descargar" top='11'/>
        <table ref={tableRef} className="pedidos-table table-sm table-hover align-middle mb-0">
          <thead className="table-light sticky-top">
            <tr className="fw-bold text-secondary text-uppercase small">
              <th style={{ minWidth: '100px' }}>PO</th>
              {/* <th style={{ minWidth: '150px' }}>Cliente Origen</th> */}
              {/* <th style={{ minWidth: '100px' }}>Línea Producto</th> */}
              <th style={{ minWidth: '150px' }}>Producto</th>
              <th className="text-center" style={{ minWidth: '80px' }}>Cantidad</th>
              <th style={{ minWidth: '80px' }}>Peso</th>
              {/* <th className="text-center" style={{ minWidth: '100px' }}>Total USD</th> */}
              {/* <th style={{ minWidth: '100px' }}>Empresa Ventas</th> */}
              <th style={{ minWidth: '100px' }}>Destino</th>
              <th style={{ minWidth: '80px' }}>Fecha</th>
              <th style={{ minWidth: '80px' }}>ETA Port</th>
            </tr>
          </thead>
          <tbody>
            {pedidosAgrupados.map((po, poIdx) => (
              <React.Fragment key={po.po}>
                {po.items.map((item, itemIdx) => (
                  <tr key={`${po.po}-${itemIdx}`} className={itemIdx % 2 === 0 ? 'bg-white' : 'bg-light'}>
                    {itemIdx === 0 && (
                      <>
                        <td className="fw-bold text-primary text-center" rowSpan={po.items.length} style={{ backgroundColor: '#ffffff' }}>
                          {po.po}
                        </td>
                      </>
                    )}
                    {/* <td className="text-muted small">{item.lineaproducto || '-'}</td> */}
                    <td className="fw-bold">{item.nombreitem || '-'}</td>
                    <td className="text-center bg-info">{formatNum(item.cantidad)}</td>
                    <td className="text-center text-muted small">{item.kilos || '-'}</td>
                    {/* <td className="text-center fw-bold text-success">{formatUSD(parseFloat(item.totallineasd) || 0)}</td> */}
                    {/* <td className="text-muted small">{item.empventas || '-'}</td> */}
                    <td className="text-center text-muted small">{item.destino || '-'}</td>
                    <td className="text-center text-muted small">
                      {item.getDate?.() ? item.getDate().toLocaleDateString('es-EC') : '-'}
                    </td>
                    <td className="text-center text-muted small text-center">A1</td>
                  </tr>
                ))}
                {/* Fila de subtotales por PO */}
                {po.items.length > 1 && (
                  <tr className="fw-bold" style={{ backgroundColor: '#f0f8ff' }}>
                    <td colSpan="2" className="text-center">Subtotal PO:</td>
                    <td className="text-center text-primary fw-bold">{formatNum(po.totalUnidades)}</td>
                    <td className="text-center text-success fw-bold">{formatNum(po.totalKilos)}</td>
                    <td colSpan="3"></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {/* Totales generales */}
            {/* <tr >
              <td colSpan="7" style={{padding:"15px", pointerEvents: "none", backgroundColor:"#3b2d11ff"}}></td>
            </tr> */}
            <tr className="fw-bold" style={{ backgroundColor: '#f8f9fa', borderTop: '3px solid #7abf3b' }}>
              <td colSpan="2" className="text-center">TOTALES GENERALES:</td>
              <td className="text-center text-primary fw-bold" style={{ fontSize: '1.1rem' }}>{formatNum(totalesGenerales.totalUnidades)}</td>
              <td className="text-center text-primary fw-bold" style={{ fontSize: '1.1rem' }}>{formatNum(totalesGenerales.totalKilos)}</td>
              {/* <td className="text-center text-success fw-bold" style={{ fontSize: '1.1rem' }}>{formatUSD(totalesGenerales.totalFactura)}</td> */}
              <td colSpan="3" className="text-muted" style={{textAlign:'right', fontSize: '0.95rem' }}>
                ({totalesGenerales.totalPOs} POs)
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Resumen con tarjetas */}
      <div className="cards-kpi">
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-receipt"></i> Total POs
            </small>
            <h5 className="text-primary fw-bold mb-0">{totalesGenerales.totalPOs}</h5>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-bag"></i> Total Unidades
            </small>
            <h5 className="text-primary fw-bold mb-0">{formatNum(totalesGenerales.totalUnidades)}</h5>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-coin"></i> Total USD
            </small>
            <h5 className="text-primary fw-bold mb-0">{formatUSD(totalesGenerales.totalFactura)}</h5>
          </div>
        </div>
        <div className="card border-0 shadow-sm">
          <div className="card-body">
            <small className="text-muted d-block mb-2">
              <i className="bi bi-arrow-repeat"></i> Promedio USD/PO
            </small>
            <h5 className="text-primary fw-bold mb-0">{formatUSD(totalesGenerales.totalFactura / totalesGenerales.totalPOs)}</h5>
          </div>
        </div>
      </div>
    </div>
  );
}
