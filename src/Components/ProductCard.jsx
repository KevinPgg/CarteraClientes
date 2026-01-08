// src/Components/ProductCard.jsx

export default function ProductCard({ product }) {
  const handleImageError = (e) => {
    e.currentTarget.src = "https://via.placeholder.com/300x200?text=Producto";
  };

  const getAvailabilityClass = () => {
    switch (product.availability) {
      case "en-stock":
        return "in-stock";
      case "reserva":
        return "reservation";
      case "agotado":
        return "out-of-stock";
      default:
        return "";
    }
  };

  return (
    <div className="card product-card">
      <img
        src={product.imageUrl}
        alt={product.name}
        onError={handleImageError}
        className="card-img-top"
      />
      <div className="card-body">
        <h5 className="card-title">{product.name}</h5>
        <p className="card-text">{product.description}</p>
        <p className="card-price">
          ${product.price?.toFixed(2) || "N/A"}
        </p>
        <span className={`badge badge-${getAvailabilityClass()}`}>
          {product.availability || "Disponible"}
        </span>
      </div>
    </div>
  );
}