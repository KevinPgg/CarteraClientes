import express from 'express';
import prisma from '../lib/prisma.js';
import { Item } from '../src/modelsDB/Item.js';

const router = express.Router();

/**
 * GET /api/items
 * Obtener todos los items o buscar por código/nombre
 */
router.get('/', async (req, res) => {
  const startTime = Date.now();
  try {
    const { search } = req.query;

    if (search) {
      console.log(`🏷️  Buscando items con: "${search}"`);
    } else {
      console.log('🏷️  Consultando todos los items');
    }

    let itemsData;

    if (search) {
      itemsData = await prisma.item.findMany({
        where: {
          OR: [
            {
              codigo: {
                contains: search,
                mode: 'insensitive'
              }
            },
            {
              nombre: {
                contains: search,
                mode: 'insensitive'
              }
            }
          ]
        }
      });
    } else {
      itemsData = await prisma.item.findMany();
    }

    const responseTime = Date.now() - startTime;
    console.log(`✅ Items obtenidos: ${itemsData.length} registros [${responseTime}ms]`);

    // Convertir a modelos Item para serialización consistente
    const items = itemsData.map(data => new Item(data));
    res.json(items.map(i => i.toJSON()));

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error al obtener items [${responseTime}ms]:`, error.message);
    res.status(500).json({ error: 'Error al obtener items' });
  }
});

/**
 * GET /api/items/:id
 * Obtener un item específico
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.item.findUnique({
      where: { id: parseInt(id) }
    });

    if (!item) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    res.json(item);

  } catch (error) {
    console.error('Error al obtener item:', error);
    res.status(500).json({ error: 'Error al obtener item' });
  }
});

export default router;
