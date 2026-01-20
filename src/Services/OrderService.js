// src/services/OrderService.js
import { UserOrder, OrderStatus } from "../models/UserOrder";

// Cache simple de solicitudes en vuelo para evitar llamadas duplicadas
// Clave: cardCode (lowercase) -> Promise de la respuesta
const inflightOrders = new Map();

/**
 * Obtiene órdenes de un cliente específico desde el backend
 * @param {string} cardCode - Código del cliente
 * @returns {Promise<UserOrder[]>} Array de órdenes
 */
export async function getOrders(cardCode) {
  if (!cardCode) {
    console.warn('⚠️ getOrders: cardCode es null/undefined');
    return [];
  }
  
  const key = String(cardCode).toLowerCase();
  if (inflightOrders.has(key)) {
    console.log('↪️ getOrders: reutilizando solicitud en vuelo para', cardCode);
    return inflightOrders.get(key);
  }

  const promise = (async () => {
    try {
      console.log('📊 getOrders: Obteniendo órdenes para cliente:', cardCode);
      const response = await fetch(`/api/cartera/${encodeURIComponent(cardCode)}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('📊 getOrders: Datos recibidos:', data?.length, 'registros');
      return parseOrdersFromDatabase(data);
    } catch (error) {
      console.error("❌ Error al obtener órdenes:", error);
      return [];
    } finally {
      // Limpiar del mapa al finalizar (éxito o error)
      inflightOrders.delete(key);
    }
  })();

  inflightOrders.set(key, promise);
  return promise;
}

/**
 * Obtiene pedidos del cliente autenticado
 * @param {string} clienteorigen - Nombre del cliente (cardName)
 * @param {string} po - (Opcional) PO específico a filtrar
 * @returns {Promise<Object[]>} Array de pedidos con validación
 */
export async function getPedidos(clienteorigen, po = null) {
  if (!clienteorigen) {
    console.warn('⚠️ getPedidos: clienteorigen es requerido');
    return [];
  }

  try {
    let url = `/api/pedidos/${encodeURIComponent(clienteorigen)}`;
    if (po) {
      url += `?po=${encodeURIComponent(po)}`;
    }

    console.log(`📊 getPedidos: Obteniendo pedidos para cliente: ${clienteorigen}` + (po ? ` | PO: ${po}` : ''));
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 400) {
        const error = await response.json();
        console.error('❌ Error en validación:', error);
        return [];
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 getPedidos: Datos recibidos:', data?.length, 'registros');
    console.log('📊 getPedidos (muestreo):', data?.slice(0, 2));
    
    // Importar dinámicamente Pedido para recrear instancias con métodos
    const { Pedido } = await import('../modelsDB/Pedido.js');
    const pedidosConMetodos = data.map(p => new Pedido(p));
    console.log('📊 getPedidos (con métodos):', pedidosConMetodos?.slice(0, 2));
    
    return pedidosConMetodos || [];
  } catch (error) {
    console.error("❌ Error al obtener pedidos:", error);
    return [];
  }
}

/**
 * Obtiene todos los clientes únicos de la tabla users
 * @returns {Promise<Array>} Array de clientes { code: cardCode, name: cardName }
 */
export async function getAllClients() {
  try {
    console.log('📊 getAllClients: Obteniendo todos los clientes');
    const response = await fetch('/api/auth');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const users = await response.json();
    console.log('📊 getAllClients: Usuarios recibidos:', users?.length, 'registros');
    
    // Filtrar y extraer clientes únicos con cardCode y cardName
    const clients = users
      .filter(u => u.cardCode && u.cardName)
      .map(u => ({
        code: u.cardCode,
        name: u.cardName
      }))
      .reduce((unique, client) => {
        // Evitar duplicados por cardCode
        if (!unique.find(c => c.code === client.code)) {
          unique.push(client);
        }
        return unique;
      }, [])
      .sort((a, b) => a.name.localeCompare(b.name));
    
    console.log('📊 getAllClients: Clientes únicos:', clients.length, clients);
    return clients;
  } catch (error) {
    console.error("❌ Error al obtener todos los clientes:", error);
    return [];
  }
}

/**
 * Obtiene todas las órdenes del sistema
 * @returns {Promise<UserOrder[]>} Array de todas las órdenes
 */

/**
 * Convierte datos de la BD (Cartera model) a UserOrder para el frontend
 * Los datos ya vienen procesados del backend con JSON serialization correcta
 */
function parseOrdersFromDatabase(data) {
  try {
    const list = [];

    for (const d of data) {
      const u = new UserOrder();
      u.docEntry = d.id || d.docentry;
      u.cardCode = d.cardcode || "";
      u.cardName = d.cardname || "";
      u.docNum = d.docnum; // Ya es string del backend
      u.folioNum = d.folionum || "";

      // Las fechas vienen como strings ISO desde el backend
      u.docDate = d.docdate ? new Date(d.docdate) : null;
      u.docDueDate = d.docduedate ? new Date(d.docduedate) : null;
      u.taxDate = d.taxdate ? new Date(d.taxdate) : null;

      u.numAtCard = d.po || "";
      u.docTotal = d.doctotal || 0; // Ya es número del backend
      u.clase = d.clase || "";
      u.dias_pendientes = d.dias_pendientes || 0;
      u.comments = d.comments || "";

      // SaldoVencido ya es número del backend
      u.saldoVencido = d.saldovencido || 0;

      u.tipoCliente = d.tipocliente || "";

      // Status
      const status = d.status;
      if (Object.values(OrderStatus).includes(status)) {
        u.status = status;
      } else {
        u.status = OrderStatus.EnProceso;
      }

      list.push(u);
    }
    return list;
  } catch (err) {
    console.error("parseOrdersFromDatabase error:", err);
    return [];
  }
}