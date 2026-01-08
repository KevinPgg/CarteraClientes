// src/Pages/Shop.jsx
import { useEffect, useState } from "react";
import ProductCard from "../Components/ProductCard";
import { getProducts } from "../Services/ProductService";

export default function Shop() {
  const [products, setProducts] = useState([]);
  const [filtered, setFiltered] = useState(null);
  const [categories, setCategories] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedAvailability, setSelectedAvailability] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  useEffect(() => {
    const all = getProducts();
    setProducts(all);
    setCategories([...new Set(all.map((p) => p.category))]);
    applyFilters(all, search, selectedCategory, selectedAvailability);
  }, []);

  const applyFilters = (list = products, s = search, cat = selectedCategory, avail = selectedAvailability) => {
    if (!list) {
      setFiltered([]);
      return;
    }
    const result = list.filter((p) =>
      (s === "" || p.name.toLowerCase().includes(s.toLowerCase()) || p.description.toLowerCase().includes(s.toLowerCase())) &&
      (cat === "" || p.category === cat) &&
      (avail === "" || mapAvailability(avail) === p.availability)
    );
    setFiltered(result);
  };

  const handleEnter = (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  };

  const mapAvailability = (value) => {
    switch (value) {
      case "EnStock": return "EnStock";
      case "BajoPedido": return "BajoPedido";
      case "Agotado": return "Agotado";
      default: return null;
    }
  };

  return (
    <div className="shop-page">
      <h1>Tienda</h1>

      <div className="filters mb-3">
        <input
          className="form-control mb-2"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            applyFilters(products, e.target.value, selectedCategory, selectedAvailability);
          }}
          onKeyDown={handleEnter}
        />
        <div className="d-flex gap-2">
          <select
            className="form-select"
            value={selectedAvailability}
            onChange={(e) => {
              setSelectedAvailability(e.target.value);
              applyFilters(products, search, selectedCategory, e.target.value);
            }}
          >
            <option value="">Todas las disponibilidades</option>
            <option value="EnStock">En stock</option>
            <option value="BajoPedido">Bajo pedido</option>
            <option value="Agotado">Agotado</option>
          </select>
          <select
            className="form-select"
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              applyFilters(products, search, e.target.value, selectedAvailability);
            }}
          >
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="product-grid">
        {filtered === null ? (
          <p>Cargando productos...</p>
        ) : filtered.length === 0 ? (
          <p>No se encontraron productos con esos filtros.</p>
        ) : (
          filtered.map((p) => <ProductCard key={p.id} product={p} />)
        )}
      </div>
    </div>
  );
}