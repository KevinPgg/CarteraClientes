/**
 * Pedido Model - Corresponds to 'pedidos' table
 * Represents order line items
 */
export class Pedido {
  constructor(data = {}) {
    this.id = data.id;
    this.po = data.po; // Purchase order
    this.lineanegocio = data.lineanegocio; // Business line
    this.lineaproducto = data.lineaproducto; // Product line
    this.tipocliente = data.tipocliente; // Client type
    this.itemcode = data.itemcode; // Item/SKU code
    this.nombreitem = data.nombreitem; // Item name
    this.sabor = data.sabor; // Flavor
    this.presentacion = data.presentacion; // Presentation
    this.preciounitario = data.preciounitario; // Unit price (Decimal)
    this.cantidad = data.cantidad; // Quantity
    this.cantidadpendiente = data.cantidadpendiente; // Pending quantity
    this.kilos = data.kilos; // Kilos (Decimal)
    this.kilospendientes = data.kilospendientes; // Pending kilos (Decimal)
    this.container = data.container; // Container size (Decimal)
    this.exportacion_d = data.exportacion_d; // Export amount (Decimal)
    this.locald = data.locald; // Local amount (Decimal)
    this.totallineasd = data.totallineasd; // Total line amount (Decimal)
    this.totalpendiented = data.totalpendiented; // Total pending amount (Decimal)
    this.statuslinea = data.statuslinea; // Line status
    this.fechapedido = data.fechapedido; // Order date
    this.fechaexpected = data.fechaexpected; // Expected date
    this.cliente = data.cliente; // Client name
    this.empventas = data.empventas; // Sales employee
    this.destino = data.destino; // Destination
    this.puertodestino = data.puertodestino; // Destination port
  }

  /**
   * Get date as Date object from fechapedido
   * Parsea la fecha en zona horaria local para evitar desfase de días
   */
  getDate() {
    if (!this.fechapedido) return null;
    if (typeof this.fechapedido === 'string') {
      const [year, month, day] = this.fechapedido.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return this.fechapedido;
  }

  /**
   * Get expected date as Date object
   * Parsea la fecha en zona horaria local para evitar desfase de días
   */
  getExpectedDate() {
    if (!this.fechaexpected) return null;
    if (typeof this.fechaexpected === 'string') {
      const [year, month, day] = this.fechaexpected.split('T')[0].split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return this.fechaexpected;
  }

  /**
   * Get week number from fechapedido
   */
  getWeekNumber() {
    const date = this.getDate();
    if (!date) return null;
    
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNum = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNum;
  }

  /**
   * Convert Decimals to numbers for JSON serialization
   */
  toJSON() {
    const fechaPedido = this.getDate();
    const fechaExpected = this.getExpectedDate();
    
    return {
      id: this.id,
      po: this.po,
      lineanegocio: this.lineanegocio,
      lineaproducto: this.lineaproducto,
      tipocliente: this.tipocliente,
      itemcode: this.itemcode,
      nombreitem: this.nombreitem,
      sabor: this.sabor,
      presentacion: this.presentacion,
      preciounitario: this.preciounitario ? parseFloat(this.preciounitario) : null,
      cantidad: this.cantidad,
      cantidadpendiente: this.cantidadpendiente,
      kilos: this.kilos ? parseFloat(this.kilos) : null,
      kilospendientes: this.kilospendientes ? parseFloat(this.kilospendientes) : null,
      container: this.container ? parseFloat(this.container) : null,
      exportacion_d: this.exportacion_d ? parseFloat(this.exportacion_d) : null,
      locald: this.locald ? parseFloat(this.locald) : null,
      totallineasd: this.totallineasd ? parseFloat(this.totallineasd) : null,
      totalpendiented: this.totalpendiented ? parseFloat(this.totalpendiented) : null,
      statuslinea: this.statuslinea,
      fechapedido: fechaPedido ? fechaPedido.toISOString().split('T')[0] : null,
      fechaexpected: fechaExpected ? fechaExpected.toISOString().split('T')[0] : null,
      cliente: this.cliente,
      empventas: this.empventas,
      destino: this.destino,
      puertodestino: this.puertodestino
    };
  }
}
