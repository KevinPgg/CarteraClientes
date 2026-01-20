import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import dotenv from 'dotenv';
import prisma from '../lib/prisma.js';

// Cargar variables de entorno (.env)
dotenv.config();

// Valor fijo para status (ajusta si prefieres null u otro código)
const STATUS_VALUE = 0; // "transito"
const BATCH_SIZE = 500;

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
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  const n = Number.parseFloat(cleaned);
  return Number.isNaN(n) ? null : n;
}

function toDate(value) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function readCsv(filePath) {
  return new Promise((resolve, reject) => {
    const records = [];
    fs.createReadStream(filePath)
      .pipe(
        parse({
          columns: true,
          delimiter: ';',
          skip_empty_lines: true,
          trim: true,
        })
      )
      .on('data', (row) => records.push(row))
      .on('end', () => resolve(records))
      .on('error', (err) => reject(err));
  });
}

function mapRow(row) {
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
    doctotal: toNumber(row.DocTotal),
    clase: row.Clase || null,
    diasPendientes: toInt(row['dias_pendientes'] ?? row.dias_pendientes),
    comments: row.Comments || null,
    saldovencido: toNumber(row.SaldoVencido),
    tipocliente: row.TipoCliente || null,
    status: STATUS_VALUE,
  };
}

async function truncateTable() {
  console.log('🧹 Limpiando tabla cartera...');
  // Usar DELETE en lugar de TRUNCATE para evitar problemas de permisos
  await prisma.$executeRawUnsafe('DELETE FROM "cartera"');
  
  // Intentar resetear la secuencia (puede fallar si no hay permisos, pero no es crítico)
  try {
    await prisma.$executeRawUnsafe('ALTER SEQUENCE cartera_id_seq RESTART WITH 1');
    console.log('✅ Secuencia ID reseteada');
  } catch (err) {
    console.warn('⚠️  No se pudo resetear la secuencia (IDs continuarán desde el último):', err.message);
  }
}

async function insertBatches(data) {
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const batch = data.slice(i, i + BATCH_SIZE);
    console.log(`⬆️  Insertando batch ${i / BATCH_SIZE + 1} (${batch.length} registros)...`);
    await prisma.cartera.createMany({ data: batch });
  }
}

async function main() {
  const csvArg = process.argv[2];
  if (!csvArg) {
    console.error('Uso: node scripts/import-cartera.js <ruta-al-csv>');
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), csvArg);
  if (!fs.existsSync(csvPath)) {
    console.error('No se encontró el archivo CSV en', csvPath);
    process.exit(1);
  }

  console.log('📄 Leyendo CSV:', csvPath);
  const rawRows = await readCsv(csvPath);
  console.log('📊 Filas leídas:', rawRows.length);

  const mapped = rawRows
    .map(mapRow)
    .filter((r) => r.cardcode || r.cardname); // descartar filas vacías

  console.log('📦 Filas mapeadas listas para insertar:', mapped.length);

  await truncateTable();
  await insertBatches(mapped);

  console.log('✅ Importación completa');
}

main()
  .catch((err) => {
    console.error('❌ Error en importación:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
