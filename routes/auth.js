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
 * GET /api/auth
 * Obtener lista simple de clientes (para selectores)
 */
router.get('/', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista de clientes...');
    
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

/**
 * GET /api/auth/users
 * Obtener lista completa de usuarios con todos los campos
 */
router.get('/users', async (req, res) => {
  try {
    console.log('📋 Obteniendo lista completa de usuarios...');
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        cardCode: true,
        cardName: true,
        usuario: true,
        tipo: true,
        email: true,
        notificacion: true,
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

/**
 * POST /api/auth/users
 * Crear nuevo usuario
 */
router.post('/users', async (req, res) => {
  try {
    const { usuario, password, cardCode, cardName, tipo, email, notificacion } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    // Verificar si el usuario ya existe
    const existing = await prisma.user.findUnique({ where: { usuario } });
    if (existing) {
      return res.status(409).json({ error: 'El usuario ya existe' });
    }

    // Hashear contraseña con bcrypt vía PostgreSQL crypt()
    const hashedPassword = await prisma.$queryRaw`SELECT crypt(${password}::text, gen_salt('bf')) as hash`;
    const passwordHash = hashedPassword[0].hash;

    // Crear usuario
    const newUser = await prisma.user.create({
      data: {
        usuario,
        password: passwordHash,
        cardCode: cardCode || null,
        cardName: cardName || null,
        tipo: tipo || 'C',
        email: Array.isArray(email) ? email : [email].filter(Boolean),
        notificacion: notificacion || false,
      }
    });

    console.log(`✅ Usuario creado: ${newUser.usuario}`);
    res.status(201).json({ message: 'Usuario creado', id: newUser.id });

  } catch (error) {
    console.error('❌ Error creando usuario:', error.message);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

/**
 * PUT /api/auth/users/:id
 * Actualizar usuario existente
 */
router.put('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { usuario, password, cardCode, cardName, tipo, email, notificacion } = req.body;

    const updateData = {
      usuario,
      cardCode: cardCode || null,
      cardName: cardName || null,
      tipo: tipo || 'C',
      email: Array.isArray(email) ? email : [email].filter(Boolean),
      notificacion: notificacion || false,
    };

    // Si se proporciona contraseña, hashearla
    if (password) {
      const hashedPassword = await prisma.$queryRaw`SELECT crypt(${password}::text, gen_salt('bf')) as hash`;
      updateData.password = hashedPassword[0].hash;
    }

    const updated = await prisma.user.update({
      where: { id: parseInt(id) },
      data: updateData
    });

    console.log(`✅ Usuario actualizado: ${updated.usuario}`);
    res.json({ message: 'Usuario actualizado' });

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error.message);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

/**
 * DELETE /api/auth/users/:id
 * Eliminar usuario
 */
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.user.delete({
      where: { id: parseInt(id) }
    });

    console.log(`✅ Usuario eliminado: ID ${id}`);
    res.json({ message: 'Usuario eliminado' });

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error.message);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

export default router;

