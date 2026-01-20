/**
 * Cartera Model - Corresponds to 'cartera' table
 * Represents customer invoices/orders
 */
export class Cartera {
  constructor(data = {}) {
    this.id = data.id;
    this.docentry = data.docentry;
    this.cardcode = data.cardcode; // Customer code (FK)
    this.cardname = data.cardname; // Customer name
    this.docnum = data.docnum; // Document number (BigInt)
    this.folionum = data.folionum; // Folio/Reference number
    this.docduedate = data.docduedate; // Due date
    this.docdate = data.docdate; // Document date
    this.taxdate = data.taxdate; // Tax date
    this.po = data.po; // Purchase order
    this.doctotal = data.doctotal; // Total amount (Decimal)
    this.clase = data.clase; // Document class/type
    // Prisma mapea como diasPendientes; backend puede enviar dias_pendientes
    // Si no viene, lo calculamos en base a docduedate vs hoy
    const diasPrisma = data.dias_pendientes ?? data.diasPendientes;
    if (typeof diasPrisma === 'number') {
      this.dias_pendientes = diasPrisma; // Days pending (puede ser negativo si no vence aún)
    } else {
      // Calcular días pendientes: hoy - fecha vencimiento (positivo si está vencido)
      const due = data.docduedate instanceof Date ? data.docduedate : (data.docduedate ? new Date(data.docduedate) : null);
      if (due) {
        const MS_PER_DAY = 24 * 60 * 60 * 1000;
        const today = new Date();
        // normalizar a medianoche para evitar desfases por horas
        const d0 = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
        const d1 = new Date(Date.UTC(due.getFullYear(), due.getMonth(), due.getDate()));
        const diff = Math.floor((d0 - d1) / MS_PER_DAY);
        this.dias_pendientes = diff;
      } else {
        this.dias_pendientes = 0;
      }
    }
    this.comments = data.comments;
    this.saldovencido = data.saldovencido; // Overdue balance (Decimal)
    this.tipocliente = data.tipocliente; // Customer type
    this.status = data.status; // Status code
  }

  /**
   * Convert BigInt to string for JSON serialization
   */
  toJSON() {
    return {
      id: this.id,
      docentry: this.docentry,
      cardcode: this.cardcode,
      cardname: this.cardname,
      docnum: String(this.docnum), // Convert BigInt to string
      folionum: this.folionum,
      docduedate: this.docduedate?.toISOString().split('T')[0],
      docdate: this.docdate?.toISOString().split('T')[0],
      taxdate: this.taxdate?.toISOString().split('T')[0],
      po: this.po,
      doctotal: this.doctotal ? parseFloat(this.doctotal) : null,
      clase: this.clase,
      dias_pendientes: this.dias_pendientes,
      comments: this.comments,
      saldovencido: this.saldovencido ? parseFloat(this.saldovencido) : null,
      tipocliente: this.tipocliente,
      status: this.status
    };
  }
}
