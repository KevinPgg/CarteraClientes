import React from 'react';
import ExcelJS from 'exceljs';

/**
 * ExportXLSXButton
 * Reusable button to export an HTML table to .xlsx using ExcelJS
 * Props:
 * - tableRef: React ref to the <table> element
 * - fileName: string for the download file (default: export.xlsx)
 * - sheetName: string for the sheet (default: Hoja1)
 * - className: optional classes for the button
 */
export default function ExportXLSXButton({ tableRef, fileName = 'export.xlsx', sheetName = 'Hoja1', className = '', top = '' }) {
  const handleExport = async () => {
    try {
      if (!tableRef?.current) {
        console.warn('ExportXLSXButton: tableRef is missing or not attached');
        return;
      }

      const table = tableRef.current;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(sheetName);

      // Extract headers from <thead>
      const headers = [];
      const headerRow = table.querySelector('thead tr');
      if (headerRow) {
        headerRow.querySelectorAll('th').forEach((th) => {
          headers.push(th.textContent.trim());
        });
        worksheet.addRow(headers);
        
        // Style header row
        const headerRowExcel = worksheet.getRow(1);
        headerRowExcel.font = { bold: true };
        headerRowExcel.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8F9FA' }
        };
      }

      // Extract data from <tbody>
      const tbody = table.querySelector('tbody');
      if (tbody) {
        tbody.querySelectorAll('tr').forEach((tr) => {
          const rowData = [];
          tr.querySelectorAll('td').forEach((td) => {
            rowData.push(td.textContent.trim());
          });
          worksheet.addRow(rowData);
        });
      }

      // Auto-size columns
      worksheet.columns.forEach((column) => {
        let maxLength = 0;
        column.eachCell({ includeEmpty: true }, (cell) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.max(maxLength, cellValue.length);
        });
        column.width = Math.min(maxLength + 2, 50);
      });

      // Generate buffer and download
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
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
