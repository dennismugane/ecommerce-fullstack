import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { addToCart } from "../../services/productService";
import { formatMoneyCurrency } from "../../utils/formatMoneyCurrency";
import "./Product.css";
import StarRating from "./starRating";

const BASE_URL = "";

export function Product({ product, loadCart }) {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const navigate = useNavigate();

  const handleAddToCart = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      await addToCart(product.id, quantity);
      if (loadCart) await loadCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setLoading(false);
    }
  };

  const goToDetail = () => navigate(`/products/${product.id}`);

  return (
    <div className="pc-card">
      {/* Clickable image */}
      <div className="pc-img-wrap" onClick={goToDetail}>
        <img
          src={`/${product.image}`}
          alt={product.name}
          className="pc-img"
        />
      </div>

      <div className="pc-body">
        {/* Clickable name */}
        <div className="pc-name" onClick={goToDetail}>
          {product.name}
        </div>

        {/* Star rating */}
        {product.rating > 0 && <StarRating rating={product.rating} />}

        <div className="pc-price">{formatMoneyCurrency(product.price)}</div>

        {/* Quantity + Add to Cart */}
        <div className="pc-footer">
          <select
            className="pc-qty"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            onClick={(e) => e.stopPropagation()}
          >
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>

          <button
            className={`pc-btn ${loading ? "pc-btn--loading" : ""} ${added ? "pc-btn--added" : ""}`}
            onClick={handleAddToCart}
            disabled={loading || added}
          >
            {loading ? (
              <span className="pc-spinner" />
            ) : added ? (
              "✓ Added"
            ) : (
              <>
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                >
                  <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
