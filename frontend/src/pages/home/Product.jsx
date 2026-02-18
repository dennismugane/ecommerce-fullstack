import axios from "axios";
import { useState } from "react";
import { formatMoneyCurrency } from "../../utils/formatMoneyCurrency";

export function Product({ product, loadCart }) {
  const [quantity, setQuantity] = useState(1);
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const addToCart = async () => {
    await axios.post(`${BASE_URL}/api/cart`, {
      productId: product.id,
      quantity: quantity, // Now uses the selected quantity!
    });
    await loadCart();
  };
  const selectedQuantity = (e) => {
    setQuantity(Number(e.target.value));
  };

  return (
    <div className="product-container">
      <div className="product-image-container">
        <img
          className="product-image"
          src={`${BASE_URL}/${product.image}`}
          alt={product.name}
        />
      </div>

      <div className="product-name limit-text-to-2-lines">{product.name}</div>

      <div className="product-rating-container">
        <img
          className="product-rating-stars"
          src={`/images/ratings/rating-${product.rating * 10}.png`}
        />
        <div className="product-rating-count link-primary">
          {product.ratingCount}
        </div>
      </div>

      <div className="product-price">{formatMoneyCurrency(product.price)}</div>

      <div className="product-quantity-container">
        <select value={quantity} onChange={selectedQuantity}>
          {[...Array(10)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>
      </div>

      <button className="add-to-cart-button button-primary" onClick={addToCart}>
        Add to Cart
      </button>
    </div>
  );
}
