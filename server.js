// server.js - Servidor unificado Express + Prisma + React
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import prisma from './lib/prisma.js';
import authRoutes from './routes/auth.js';
import carteraRoutes from './routes/cartera.js';
import pedidosRoutes from './routes/pedidos.js';
import itemsRoutes from './routes/items.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Validar conexión a la base de datos al iniciar
async function validateDatabaseConnection() {
  try {
    console.log('🔍 Validando conexión a PostgreSQL...');
    await prisma.$connect();
    
    // Verificar que las tablas existen
    const userCount = await prisma.user.count();
    const carteraCount = await prisma.cartera.count();
    const pedidosCount = await prisma.pedido.count();
    const itemsCount = await prisma.item.count();
    
    console.log('✅ Conexión a base de datos exitosa');
    console.log(`📊 Registros encontrados:`);
    console.log(`   - Usuarios: ${userCount}`);
    console.log(`   - Cartera: ${carteraCount}`);
    console.log(`   - Pedidos: ${pedidosCount}`);
    console.log(`   - Items: ${itemsCount}`);
    
    return true;
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error.message);
    console.error('💡 Asegúrate de que:');
    console.error('   1. PostgreSQL está corriendo');
    console.error('   2. La base de datos "PortalWebClientes" existe');
    console.error('   3. Las tablas están creadas (ejecuta: npx prisma db push)');
    console.error('   4. Las credenciales en .env son correctas');
    return false;
  }
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos del build de React
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
console.log(`📁 Sirviendo archivos estáticos desde: ${distPath}`);

// Logging middleware con más detalle
app.use((req, res, next) => {
  // Solo log para rutas API, no para archivos estáticos
  if (req.path.startsWith('/api') || req.path === '/health') {
    const timestamp = new Date().toISOString();
    console.log(`\n📝 [${timestamp}] ${req.method} ${req.path}`);
    
    if (Object.keys(req.query).length > 0) {
      console.log('   Query params:', req.query);
    }
    
    if (req.body && Object.keys(req.body).length > 0) {
      // No mostrar contraseñas
      const sanitizedBody = { ...req.body };
      if (sanitizedBody.contrasena) sanitizedBody.contrasena = '***';
      if (sanitizedBody.password) sanitizedBody.password = '***';
      console.log('   Body:', sanitizedBody);
    }
  }
  
  next();
});

// Health check mejorado
app.get('/health', async (req, res) => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT NOW()`;
    const responseTime = Date.now() - startTime;
    
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: 'connected',
      responseTime: `${responseTime}ms`
    };
    
    console.log('✅ Health check exitoso:', health);
    res.json(health);
  } catch (error) {
    console.error('❌ Health check falló:', error.message);
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Routes API
app.use('/api/auth', authRoutes);
// Reutilizamos el router de auth para exponer GET /api/users (definido en routes/auth.js)
app.use('/api/cartera', carteraRoutes);
app.use('/api/pedidos', pedidosRoutes);
app.use('/api/items', itemsRoutes);

// 404 para rutas API no encontradas
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Servir index.html para cualquier otra ruta (React Router)
app.use((req, res, next) => {
  if (req.method !== 'GET') return next();
  res.sendFile(path.join(distPath, 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Error en el servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor', message: err.message });
});

// Start server con validación de BD
async function startServer() {
  const dbConnected = await validateDatabaseConnection();
  
  if (!dbConnected) {
    console.error('⚠️  Servidor iniciado SIN conexión a base de datos');
    console.error('⚠️  Las rutas API fallarán hasta que la BD esté disponible');
  }
  
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(70));
    console.log(`🚀 Servidor Unificado - Express + Prisma + React`);
    console.log('='.repeat(70));
    console.log(`📍 Aplicación: http://localhost:${PORT}`);
    console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    console.log('');
    console.log('📡 Rutas backend:');
    console.log(`   🔐 Auth: POST /api/auth/login`);
    console.log(`   📊 Cartera: GET /api/cartera`);
    console.log(`   📦 Pedidos: GET /api/pedidos`);
    console.log(`   🏷️  Items: GET /api/items`);
    console.log('='.repeat(70) + '\n');
  });
}

startServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  prisma.$disconnect().then(() => {
    console.log('Conexión a Prisma cerrada');
    process.exit(0);
  });
});
