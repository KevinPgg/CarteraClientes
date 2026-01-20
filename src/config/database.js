// src/config/database.js
import { Pool } from 'pg';

const pool = new Pool({
  host: 'localhost',
  database: 'PortalWebClientes',
  user: 'user',
  password: 'ussrd134',
  port: 5432, // Puerto por defecto de PostgreSQL
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el cliente de PostgreSQL', err);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Consulta ejecutada', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en consulta', { text, error: error.message });
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query;
  const release = client.release;
  
  // Modificar el método release para incluir logging
  const timeout = setTimeout(() => {
    console.error('Un cliente ha estado en uso por más de 5 segundos!');
  }, 5000);
  
  client.release = () => {
    clearTimeout(timeout);
    client.query = query;
    client.release = release;
    return release.apply(client);
  };
  
  return client;
};

export default pool;
