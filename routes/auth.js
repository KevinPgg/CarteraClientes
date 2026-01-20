import express from 'express';
import prisma from '../lib/prisma.js';
import { User } from '../src/modelsDB/User.js';

const router = express.Router();

/**
 * POST /api/auth/login
 * Autenticar usuario
 */
router.post('/login', async (req, res) => {
  const startTime = Date.now();
  try {
    const { usuario, contrasena } = req.body;

    console.log(`🔐 Intento de login para usuario: ${usuario}`);

    if (!usuario || !contrasena) {
      console.log('❌ Login fallido: datos incompletos');
      return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    // Buscar usuario en la base de datos
    const userData = await prisma.user.findUnique({
      where: { usuario }
    });

    if (!userData) {
      console.log(`❌ Usuario "${usuario}" no encontrado en BD`);
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    // Verificar contraseña contra hash bcrypt usando crypt() de PostgreSQL
    console.log('🔐 Verificando contraseña contra hash...');
    try {
      const verifyResult = await prisma.$queryRaw`
        SELECT crypt(${contrasena}::text, ${userData.password}::text) = ${userData.password}::text as password_valid
      `;
      
      const isPasswordValid = verifyResult[0]?.password_valid;
      
      if (!isPasswordValid) {
        console.log(`❌ Contraseña incorrecta para usuario "${usuario}"`);
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
    } catch (cryptError) {
      console.error('❌ Error verificando contraseña:', cryptError.message);
      return res.status(500).json({ error: 'Error al verificar contraseña' });
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Login exitoso: ${userData.cardName} (${userData.tipo}) [${responseTime}ms]`);

    // Convertir a modelo User y devolver respuesta segura
    const user = new User(userData);
    console.log(`debug[user]: ${JSON.stringify(user, null, 2)}`);
    res.json(user.toLoginResponse());

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error en login [${responseTime}ms]:`, error.message);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

/**
 * GET /api/users
 * Obtener lista de todos los usuarios
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de todos los usuarios...');
    
    const users = await prisma.user.findMany({
      select: {
        cardCode: true,
        cardName: true,
        usuario: true,
        tipo: true,
        email: true,
      },
      orderBy: {
        cardName: 'asc'
      }
    });

    console.log(`✅ ${users.length} usuarios encontrados`);
    res.json(users);

  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error.message);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
});

export default router;

