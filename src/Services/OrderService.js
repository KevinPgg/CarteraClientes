// src/services/OrderService.js
import { UserOrder, OrderStatus } from "../models/UserOrder";

let orders = [];
let lastUserType = null;

async function ensureLoaded(currentUserType) {
  // If the user type has changed (e.g. admin logout, client login), clear the cache.
  if (lastUserType !== currentUserType) {
    orders = [];
    lastUserType = currentUserType;
  }

  if (orders && orders.length > 0) return;

  try {
    // Intentar cargar desde /public/data/cartera.json
    const res = await fetch("/data/cartera.json");
    if (res.ok) {
      const json = await res.text(); // raw string para controlar parsing
      orders = parseOrdersFromJson(json);
      return;
    }
  } catch (err) {
    console.error("OrderService.ensureLoaded error:", err);
    orders = [];
  }
}

export async function getOrders(cardCode, userType) {
  if (!cardCode) return [];
  await ensureLoaded(userType);
  return orders.filter(
    (o) => o.cardCode?.toLowerCase() === cardCode.toLowerCase()
  );
}

export async function getAllOrders(userType) {
  await ensureLoaded(userType);
  return [...orders];
}

// Parse JSON en UserOrder, manejando fechas y valores numéricos
function parseOrdersFromJson(json) {
  try {
    const dtos = JSON.parse(json) ?? [];
    const list = [];
    const formats = ["d/M/yyyy", "dd/MM/yyyy", "d/MM/yyyy", "dd/M/yyyy"];

    for (const d of dtos) {
      const u = new UserOrder();
      u.docEntry = d.DocEntry;
      u.cardCode = d.CardCode ?? "";
      u.cardName = d.CardName ?? "";
      u.docNum = d.DocNum;
      u.folioNum = d.FolioNum ?? "";

      // Parse fechas
      u.docDate = parseDate(d.DocDate, formats);
      u.docDueDate = parseDate(d.DocDueDate, formats);
      u.taxDate = parseDate(d.TaxDate, formats);

      u.numAtCard = d.NumAtCard ?? "";
      u.docTotal = d.DocTotal ?? 0;
      u.clase = d.Clase ?? "";
      u.dias_pendientes = d.dias_pendientes ?? 0;
      u.comments = d.Comments ?? "";

      // SaldoVencido puede venir como string
      let saldo = 0;
      if (d.SaldoVencidoRaw) {
        const raw = d.SaldoVencidoRaw.replace("\r", "");
        saldo = parseFloat(raw.replace(",", "."));
        if (isNaN(saldo)) saldo = 0;
      }
      u.saldoVencido = saldo;

      u.tipoCliente = d.TipoCliente ?? "";

      // Status
      if (Object.values(OrderStatus).includes(d.Status)) {
        u.status = d.Status;
      } else {
        u.status = OrderStatus.EnProceso;
      }

      list.push(u);
    }
    return list;
  } catch (err) {
    console.error("parseOrdersFromJson error:", err);
    return [];
  }
}

function parseDate(s, formats) {
  if (!s || !s.trim()) return null;
  try {
    // Intentar parsear con Date estándar
    const parts = s.split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const year = parseInt(parts[2], 10);
      return new Date(year, month, day);
    }
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}