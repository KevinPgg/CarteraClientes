// src/Services/ProductService.js

// Disponibilidad de productos
const Availability = {
  EnStock: "en-stock",
  Reserva: "reserva",
  Agotado: "agotado",
};

const products = [
  {
    id: 1,
    name: "Chifles Sal de Mar Clásicos",
    category: "Tradicional",
    description: "Láminas extra finas de plátano verde seleccionadas, con un toque de sal marina pura.",
    price: 1.25,
    availability: Availability.EnStock,
    imageUrl: "https://images.unsplash.com/photo-1590111421957-61c0f643e13d?w=800&q=80&auto=format&fit=crop",
  },
  {
    id: 2,
    name: "Chifles Fuego Amazónico (Picantes)",
    category: "Especialidades",
    description: "Nuestra versión más picante con una mezcla de ají habanero y especias de la selva.",
    price: 1.50,
    availability: Availability.EnStock,
    imageUrl: "https://images.pexels.com/photos/9509214/pexels-photo-9509214.jpeg?auto=compress&cs=tinysrgb&w=800",
  },
  {
    id: 3,
    name: "Chifles Sabor Ajo Rostizado",
    category: "Snacks Gourmet",
    description: "Crujientes chifles infusionados con aceite de ajo horneado a baja temperatura.",
    price: 1.60,
    availability: Availability.EnStock,
    imageUrl: "data/chifle.jpg",
  },
];

export function getProducts() {
  return products;
}

export function getProductById(id) {
  return products.find(p => p.id === parseInt(id));
}