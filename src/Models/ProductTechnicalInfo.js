// src/models/ProductTechnicalInfo.js
export class TechnicalSpecs {
  constructor() {
    this.weight = "";
    this.calories = 0;
    this.ingredients = [];
    this.allergens = [];
    this.preparationTimeMinutes = 0;
  }
}

export class ProductTechnicalInfo {
  constructor() {
    this.productId = 0;
    this.technicalSpecs = new TechnicalSpecs();
  }
}