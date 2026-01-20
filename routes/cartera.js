import express from 'express';
import prisma from '../lib/prisma.js';
import { Cartera } from '../src/modelsDB/Cartera.js';

const router = express.Router();

/**
 * GET /api/cartera/:cardCode
 * Obtener cartera filtrada por cardCode
 */



router.get('/:cardCode', async (req, res) => {
  const startTime = Date.now();
  try {
    // Decodificar el cardCode que viene en la URL
    const cardCode = decodeURIComponent(req.params.cardCode);
    let usuarios=[]
    let isMultiuser=false

    if(cardCode=="CQF00000001"){
      usuarios=["C1100000002","C1100000003"];
      isMultiuser=true;
    }


    if (!cardCode) {
      console.warn('⚠️ GET /api/cartera/:cardCode - cardCode es requerido');
      return res.status(400).json({ error: 'cardCode es requerido' });
    }

    console.log(`📊 Consultando cartera para cliente: ${cardCode}`);

    // Filtrar por cardCode del cliente
    const carteraData = await prisma.cartera.findMany({
      where: {
        cardcode: isMultiuser
          ? { in: usuarios, mode: 'insensitive' }
          : { equals: cardCode, mode: 'insensitive' }
      },
      orderBy: {
        docdate: 'desc'
      }
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ Cartera obtenida: ${carteraData.length} documentos [${responseTime}ms]`);

    // Convertir a modelos Cartera para serialización correcta
    const cartera = carteraData.map(data => new Cartera(data));
    res.json(cartera.map(c => c.toJSON()));

  } catch (error) {
    const responseTime = Date.now() - startTime;
    console.error(`❌ Error al obtener cartera [${responseTime}ms]:`, error.message);
    res.status(500).json({ error: 'Error al obtener cartera' });
  }
});

/**
 * GET /api/cartera/:id
 * Obtener un documento específico de cartera
 */
// router.get('/:id', async (req, res) => {
//   try {
//     const { id } = req.params;

//     const documento = await prisma.cartera.findUnique({
//       where: { id: parseInt(id) }
//     });

//     if (!documento) {
//       return res.status(404).json({ error: 'Documento no encontrado' });
//     }

//     res.json(normalizeRecord(documento));

//   } catch (error) {
//     console.error('Error al obtener documento:', error);
//     res.status(500).json({ error: 'Error al obtener documento' });
//   }
// });

export default router;
