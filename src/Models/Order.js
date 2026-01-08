// src/models/CartItem.js
export class CartItem {
  constructor(product, quantity = 1) {
    this.product = product;
    this.quantity = quantity;
  }
  get total() {
    return (this.product?.price ?? 0) * this.quantity;
  }
}