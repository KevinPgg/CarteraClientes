/**
 * Item Model - Corresponds to 'items' table
 * Represents available products/items
 */
export class Item {
  constructor(data = {}) {
    this.id = data.id;
    this.codigo = data.codigo; // Item code/SKU (required)
    this.nombre = data.nombre; // Item name (required)
  }

  toJSON() {
    return {
      id: this.id,
      codigo: this.codigo,
      nombre: this.nombre
    };
  }
}
