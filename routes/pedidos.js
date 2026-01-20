import express from 'express';
import prisma from '../lib/prisma.js';import { Pedido } from '../src/modelsDB/Pedido.js';
const router = express.Router();

/**
 * GET /api/pedidos/:clienteorigen
 * Obtener pedidos filtrados por clienteorigen
 * Query param opcional: po (para filtrar por PO específico)
 */
router.get('/:clienteorigen', async (req, res) => {
  const startTime = Date.now();
  try {
    // Decodificar el clienteorigen que viene en la URL (ej: HOLPECA%20SOUTH%20FLORIDA%20CORP)
    const clienteorigen = decodeURIComponent(req.params.clienteorigen);
    const { po } = req.query;

    if (!clienteorigen) {
      console.warn('⚠️ GET /api/pedidos/:cliente - cliente es requerido');
      return res.status(400).json({ error: 'cliente es requerido' });
    }

    console.log(`📦 Consultando pedidos para cliente: ${clienteorigen}` + (po ? ` | PO: ${po}` : ''));

    // Construir where clause
    const where = {
      cliente: {
        equals: clienteorigen,
        mode: 'insensitive'
      }
    };

    // Agregar filtro de PO si se proporciona
    if (po) {
      where.po = {
        equals: po,
        mode: 'insensitive'
      };
    }

    const pedidosData = await prisma.pedido.findMany({
      where,
      orderBy: [{ po: 'asc' }, { id: 'asc' }]
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ Pedidos obtenidos: ${pedidosData.length} registros [${responseTime}ms]`);

    // Convertir a modelos Pedido para serialización correcta
    const pedidos = pedidosData.map(data => new Pedido(data));
    res.json(pedidos.map(p => p.toJSON()));

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error al obtener pedidos [${responseTime}ms]:`, error.message);
    res.status(500).json({ error: 'Error al obtener pedidos' });
  }
});

export default router;
