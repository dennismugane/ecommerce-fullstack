export function OrderSummary({ cart = [], onUpdateQuantity, removeCart }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  return (
    <div className="order-summary">
      {cart.map((cartItem) => {
        const productId = cartItem.product.id;
        const originalPrice =
          cartItem.product.originalPrice || cartItem.product.price; // fallback if no original
        const hasDiscount = originalPrice > cartItem.product.price;
        const currency = cartItem.product.currency || "KSh";

        return (
          <div key={productId} className="cart-item-container">
            <div className="cart-item-header">
              <span className="in-stock">In Stock</span>
            </div>

            <div className="cart-item-content">
              <div className="cart-item-left">
                <img
                  className="product-image"
                  src={`${BASE_URL}/${cartItem.product.image}`}
                  alt={cartItem.product.name}
                />
              </div>

              <div className="cart-item-middle">
                <div className="product-variation">
                  Variation: {cartItem.product.variation || ""}{" "}
                  {/* adjust if there  is variation */}
                </div>
                <div className="product-name">{cartItem.product.name}</div>
                {cartItem.product.gift && (
                  <div className="product-gift">
                    + {cartItem.product.gift} {/* e.g., Free Gift */}
                  </div>
                )}
              </div>

              <div className="cart-item-right">
                <div className="price-current">
                  {currency}{" "}
                  {cartItem.product.price.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </div>
                {hasDiscount && (
                  <div className="price-original">
                    {currency}{" "}
                    {originalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    <span className="discount-badge">
                      -
                      {Math.round(
                        ((originalPrice - cartItem.product.price) /
                          originalPrice) *
                          100,
                      )}
                      %
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className="cart-item-actions">
              <button
                className="remove-button"
                onClick={() => removeCart(productId)}
              >
                Remove
              </button>

              <div className="quantity-selector">
                <button
                  className="quantity-minus"
                  onClick={() =>
                    onUpdateQuantity(productId, cartItem.quantity - 1)
                  }
                  disabled={cartItem.quantity <= 1} // prevent negative quantity
                >
                  -
                </button>
                <span className="quantity-display">{cartItem.quantity}</span>
                <button
                  className="quantity-plus"
                  onClick={() =>
                    onUpdateQuantity(productId, cartItem.quantity + 1)
                  }
                >
                  +
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
