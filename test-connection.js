// Script para probar la conexión y operaciones básicas de la base de datos
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function testConnection() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 PRUEBA DE CONEXIÓN Y TRANSFERENCIA DE DATOS - PostgreSQL + Prisma');
  console.log('='.repeat(70) + '\n');

  try {
    // 1. Probar conexión básica
    console.log('1️⃣  Probando conexión a PostgreSQL...');
    await prisma.$connect();
    console.log('   ✅ Conexión establecida\n');

    // 2. Probar query raw
    console.log('2️⃣  Ejecutando query raw (SELECT NOW())...');
    const timeResult = await prisma.$queryRaw`SELECT NOW()`;
    console.log('   ✅ Query ejecutado:', timeResult);
    console.log('');

    // 3. Contar registros en cada tabla
    console.log('3️⃣  Contando registros en las tablas...');
    const userCount = await prisma.user.count();
    const carteraCount = await prisma.cartera.count();
    const pedidoCount = await prisma.pedido.count();
    const itemCount = await prisma.item.count();

    console.log(`   📊 Usuarios: ${userCount} registros`);
    console.log(`   📊 Cartera: ${carteraCount} registros`);
    console.log(`   📊 Pedidos: ${pedidoCount} registros`);
    console.log(`   📊 Items: ${itemCount} registros\n`);

    // 4. Leer un usuario de ejemplo
    console.log('4️⃣  Leyendo primer usuario de la tabla...');
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      console.log(`   ✅ Usuario encontrado: ${firstUser.usuario} (${firstUser.cardName})`);
      console.log(`      - Tipo: ${firstUser.tipo}`);
      console.log(`      - Email: ${firstUser.email || 'N/A'}`);
    } else {
      console.log('   ⚠️  No hay usuarios en la tabla');
    }
    console.log('');

    // 5. Leer primeros 3 documentos de cartera
    console.log('5️⃣  Leyendo primeros 3 documentos de cartera...');
    const carteraItems = await prisma.cartera.findMany({
      take: 3,
      orderBy: { docdate: 'desc' }
    });
    
    if (carteraItems.length > 0) {
      carteraItems.forEach((doc, idx) => {
        console.log(`   ✅ Documento ${idx + 1}:`);
        console.log(`      - DocNum: ${doc.docnum}`);
        console.log(`      - Cliente: ${doc.cardname} (${doc.cardcode})`);
        console.log(`      - Total: $${doc.doctotal}`);
        console.log(`      - Fecha: ${doc.docdate.toLocaleDateString()}`);
      });
    } else {
      console.log('   ⚠️  No hay documentos en cartera');
    }
    console.log('');

    // 6. Probar búsqueda con filtros
    console.log('6️⃣  Probando búsqueda con filtros en cartera...');
    const filteredCartera = await prisma.cartera.findMany({
      where: {
        diasPendientes: {
          gt: 0
        }
      },
      take: 5
    });
    console.log(`   ✅ Documentos pendientes encontrados: ${filteredCartera.length}`);
    console.log('');

    // 7. Probar búsqueda case-insensitive en items
    console.log('7️⃣  Probando búsqueda case-insensitive en items...');
    const searchItems = await prisma.item.findMany({
      where: {
        nombre: {
          contains: 'a',
          mode: 'insensitive'
        }
      },
      take: 3
    });
    
    if (searchItems.length > 0) {
      console.log(`   ✅ Items encontrados con 'a' en el nombre: ${searchItems.length}`);
      searchItems.forEach((item, idx) => {
        console.log(`      ${idx + 1}. ${item.codigo} - ${item.nombre}`);
      });
    } else {
      console.log('   ⚠️  No se encontraron items');
    }
    console.log('');

    // Resumen final
    console.log('='.repeat(70));
    console.log('✅ TODAS LAS PRUEBAS COMPLETADAS EXITOSAMENTE');
    console.log('='.repeat(70));
    console.log('\n💡 La base de datos está funcionando correctamente.');
    console.log('💡 El servidor puede conectarse y transferir datos sin problemas.\n');

  } catch (error) {
    console.error('\n❌ ERROR EN LAS PRUEBAS:');
    console.error('='.repeat(70));
    console.error(error);
    console.error('='.repeat(70));
    
    if (error.code === 'P1001') {
      console.error('\n💡 Asegúrate de que PostgreSQL está corriendo en el puerto 5432');
    } else if (error.code === 'P1003') {
      console.error('\n💡 La base de datos "PortalWebClientes" no existe');
      console.error('💡 Créala con: CREATE DATABASE "PortalWebClientes";');
    } else if (error.code === 'P2021') {
      console.error('\n💡 Las tablas no existen en la base de datos');
      console.error('💡 Ejecuta: npx prisma db push');
    }
    
    console.error('\n');
  } finally {
    await prisma.$disconnect();
    console.log('🔌 Conexión a Prisma cerrada\n');
  }
}

// Ejecutar pruebas
testConnection();
