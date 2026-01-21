import express from 'express';
import { parse } from 'csv-parse';
import prisma from '../lib/prisma.js';

const router = express.Router();
const BATCH_SIZE = 500;
const STATUS_VALUE = 0;
const TARGET_TABLE = 'cartera';
const ALLOWED_DELIMITERS = [',', ';', '\t', '|'];

function toInt(value) {
  if (value === undefined || value === null || value === '') return null;
  const n = Number.parseInt(String(value).replace(/[^0-9-]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
}

function toBigInt(value) {
  if (value === undefined || value === null || value === '') return null;
  try {
    return BigInt(String(value).replace(/[^0-9-]/g, ''));
  } catch (e) {
    return null;
  }
}

function toNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  const normalized = str.replace(/\./g, '').replace(/,/g, '.');
  const n = Number.parseFloat(normalized);
  return Number.isNaN(n) ? null : n;
}

// Formato LATAM: punto para miles, coma para decimales (3.123,45)
function toNumberLatam(value) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  // Quitar puntos (miles) y convertir coma a punto (decimal)
  const normalized = str.replace(/\./g, '').replace(/,/g, '.');
  const n = Number.parseFloat(normalized);
  return Number.isNaN(n) ? null : n;
}

// Formato US/Internacional: coma para miles, punto para decimales (3,123.45)
function toNumberUS(value) {
  if (value === undefined || value === null || value === '') return null;
  const str = String(value).trim();
  // Quitar comas (miles), mantener punto (decimal)
  const normalized = str.replace(/,/g, '');
  const n = Number.parseFloat(normalized);
  return Number.isNaN(n) ? null : n;
}

function toDate(value) {
  if (!value) return null;
  const str = String(value).trim();
  const ddmmyyyy = str.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const iso = `${yyyy}-${mm}-${dd}`;
    const d = new Date(iso);
    if (!Number.isNaN(d.getTime())) return d;
  }
  const d = new Date(str);
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapRow(row, delimiter) {
  // Elegir la función de parseo de números según el delimitador
  const parseNumber = delimiter === ',' ? toNumberUS : toNumberLatam;
  
  return {
    docentry: toInt(row.DocEntry),
    cardcode: row.CardCode || null,
    cardname: row.CardName || null,
    docnum: toBigInt(row.DocNum),
    folionum: row.FolioNum || null,
    docduedate: toDate(row.DocDueDate),
    docdate: toDate(row.DocDate),
    taxdate: toDate(row.TaxDate),
    po: row.NumAtCard || null,
    doctotal: parseNumber(row.DocTotal),
    clase: row.Clase || null,
    diasPendientes: toInt(row['dias_pendientes'] ?? row.dias_pendientes),
    comments: row.Comments || null,
    saldovencido: parseNumber(row.SaldoVencido),
    tipocliente: row.TipoCliente || null,
    status: STATUS_VALUE,
  };
}

async function parseCsvText(text, delimiter) {
  return new Promise((resolve, reject) => {
    parse(
      text,
      {
        columns: true,
        delimiter,
        skip_empty_lines: true,
        trim: true,
      },
      (err, records) => {
        if (err) return reject(err);
        resolve(records);
      }
    );
  });
}

async function validateCsvFormat(text, delimiter) {
  // Tomar las primeras 3 líneas (header + 2 filas de datos)
  const lines = text.split('\n').slice(0, 3).join('\n');
  
  try {
    const testRecords = await parseCsvText(lines, delimiter);
    
    if (testRecords.length === 0) {
      throw new Error('No se detectaron filas de datos con el delimitador seleccionado');
    }

    // Verificar columnas esperadas (al menos algunas clave)
    const expectedColumns = ['DocEntry', 'CardCode', 'CardName', 'DocNum'];
    const firstRow = testRecords[0];
    const detectedColumns = Object.keys(firstRow);
    
    const missingColumns = expectedColumns.filter(col => !detectedColumns.includes(col));
    
    if (missingColumns.length > 0) {
      throw new Error(
        `Columnas requeridas no encontradas: ${missingColumns.join(', ')}. ` +
        `Verifica el delimitador. Columnas detectadas: ${detectedColumns.slice(0, 5).join(', ')}...`
      );
    }

    return { valid: true, columns: detectedColumns, sampleRows: testRecords.length };
  } catch (error) {
    throw new Error(`Validación fallida: ${error.message}`);
  }
}

async function insertBatches(data) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    await prisma.cartera.createMany({ data: batch });
  }
}

router.post('/import-cartera', async (req, res) => {
  try {
    const { fileName, delimiter = ';', content } = req.body;

    if (!fileName || !fileName.toLowerCase().endsWith('.csv')) {
      return res.status(400).json({ error: 'Debe adjuntar un archivo .csv válido' });
    }

    if (!ALLOWED_DELIMITERS.includes(delimiter)) {
      return res.status(400).json({ error: 'Delimitador no permitido' });
    }

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Contenido CSV vacío o inválido' });
    }

    // VALIDAR FORMATO ANTES DE TOCAR LA BASE DE DATOS
    console.log('🔍 Validando formato CSV y delimitador...');
    try {
      const validation = await validateCsvFormat(content, delimiter);
      console.log(`✅ Validación exitosa: ${validation.sampleRows} filas de muestra, ${validation.columns.length} columnas`);
    } catch (validationError) {
      console.error('❌ Validación fallida:', validationError.message);
      return res.status(400).json({ 
        error: `El archivo CSV no es válido con el delimitador seleccionado (${delimiter})`, 
        detail: validationError.message 
      });
    }

    const start = Date.now();
    
    // Parsear el CSV completo con manejo de errores
    let rows;
    try {
      console.log('📄 Parseando archivo CSV completo...');
      rows = await parseCsvText(content, delimiter);
      console.log(`📊 Total de filas parseadas: ${rows.length}`);
    } catch (parseError) {
      console.error('❌ Error al parsear CSV:', parseError.message);
      return res.status(400).json({ 
        error: 'Error al procesar el archivo CSV',
        detail: parseError.message
      });
    }

    const mapped = rows.map(row => mapRow(row, delimiter)).filter((r) => r.cardcode || r.cardname);

    if (mapped.length === 0) {
      return res.status(400).json({ 
        error: 'No se encontraron filas válidas para importar',
        detail: 'Verifica que el CSV contenga al menos CardCode o CardName'
      });
    }
    
    console.log(`✅ ${mapped.length} filas válidas para insertar`);

    // Borrar y contar eliminados
    console.log('🧹 Eliminando registros antiguos...');
    const deletedResult = await prisma.cartera.deleteMany();
    console.log(`✅ ${deletedResult.count} registros eliminados`);
    
    let sequenceReset = false;
    try {
      await prisma.$executeRawUnsafe('ALTER SEQUENCE cartera_id_seq RESTART WITH 1');
      sequenceReset = true;
    } catch (err) {
      console.warn('⚠️  No se pudo resetear la secuencia:', err.message);
    }

    console.log(`📥 Insertando ${mapped.length} registros en batches...`);
    await insertBatches(mapped);

    const elapsed = Date.now() - start;
    console.log(`✅ Importación completada en ${elapsed}ms`);
    
    res.json({
      ok: true,
      message: 'Importación completada',
      table: TARGET_TABLE,
      fileName,
      delimiter,
      read: rows.length,
      inserted: mapped.length,
      deleted: deletedResult.count,
      sequenceReset,
      elapsed,
    });
  } catch (error) {
    console.error('❌ Error en importación via API:', error);
    res.status(500).json({ error: 'Error al importar cartera', detail: error.message });
  }
});

export default router;
