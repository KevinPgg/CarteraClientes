// src/models/UserOrder.js
export const OrderStatus = {
  EnProceso: 0,
  EnCamino: 1,
  Entregado: 2,
};

export class UserOrder {
  constructor() {
    this.status = OrderStatus.EnProceso;
    this.docEntry = 0;
    this.cardCode = "";
    this.cardName = "";
    this.docNum = 0;
    this.folioNum = "";
    this.docDueDate = null;
    this.docDate = null;
    this.taxDate = null;
    this.numAtCard = "";
    this.docTotal = 0;
    this.clase = "";
    this.dias_pendientes = 0;
    this.comments = "";
    this.saldoVencido = 0;
    this.tipoCliente = "";
  }
}