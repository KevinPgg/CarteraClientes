import React from 'react';
import * as XLSX from 'xlsx';

/**
 * ExportXLSXButton
 * Reusable button to export an HTML table to .xlsx
 * Props:
 * - tableRef: React ref to the <table> element
 * - fileName: string for the download file (default: export.xlsx)
 * - sheetName: string for the sheet (default: Hoja1)
 * - className: optional classes for the button
 */
export default function ExportXLSXButton({ tableRef, fileName = 'export.xlsx', sheetName = 'Hoja1', className = '', top = '' }) {
  const handleExport = () => {
    try {
      if (!tableRef?.current) {
        console.warn('ExportXLSXButton: tableRef is missing or not attached');
        return;
      }
      // Create workbook from HTML table
      const wb = XLSX.utils.table_to_book(tableRef.current, { sheet: sheetName });
      // Write the file
      XLSX.writeFile(wb, fileName);
    } catch (err) {
      console.error('Error exporting to XLSX:', err);
    }
  };

  return (
    <>

        <button
            type="button"
            onClick={handleExport}
            className={`btn btn-sm btn-outline-success ${className}`}
            title="Descargar como Excel (.xlsx)"
            aria-label="Descargar tabla como Excel"
            style={{top: `${top}px`}}
            >
            <i className="bi bi-download" /> 
            <img id="descargar" src="data/descargar.png" alt="Descargar tabla" style={{transform: 'rotate(270deg)', width: '17px', height: '17px'}}/>
        </button>
    </>
  );
}
