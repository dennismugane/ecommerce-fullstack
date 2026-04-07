import { useEffect, useState } from "react";
import "./CheckoutPage.css";
import { Link, useNavigate } from "react-router-dom";
import { formatMoneyCurrency } from "../../utils/formatMoneyCurrency";
import {
  getPaymentSummary,
  removeCartItem,
} from "../../services/productService";
import axios from "axios";

/* ─── CHECKOUT HEADER ─── */
function CheckoutHeader({ totalItems }) {
  return (
    <header className="co-header">
      <Link to="/" className="co-header-logo">
        <div className="co-header-logo-icon">
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>
        <span>SuperSimpleDev</span>
      </Link>

      <div className="co-header-middle">
        Checkout&nbsp;
        <Link to="/" className="co-header-count">
          ({totalItems} items)
        </Link>
      </div>

      <div className="co-header-right">
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
        <span>Secure Checkout</span>
      </div>
    </header>
  );
}

/* ─── ORDER SUMMARY ─── */
function OrderSummary({ cart = [], onUpdateQuantity, removeCart }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  return (
    <div className="co-items">
      {cart.map((cartItem) => {
        const productId = cartItem.product.id;
        const originalPrice =
          cartItem.product.originalPrice || cartItem.product.price;
        const hasDiscount = originalPrice > cartItem.product.price;
        const currency = cartItem.product.currency || "KSh";

        return (
          <div key={productId} className="co-card">
            {/* Card top bar */}
            <div className="co-card-bar">
              <span className="co-in-stock">
                <span className="co-in-stock-dot" /> In Stock
              </span>
            </div>

            {/* Card body */}
            <div className="co-card-body">
              <div className="co-card-img-wrap">
                <img
                  src={`${BASE_URL}/${cartItem.product.image}`}
                  alt={cartItem.product.name}
                  className="co-card-img"
                />
              </div>

              <div className="co-card-info">
                {cartItem.product.variation && (
                  <div className="co-variation">
                    Variation: {cartItem.product.variation}
                  </div>
                )}
                <div className="co-product-name">{cartItem.product.name}</div>
                {cartItem.product.gift && (
                  <div className="co-gift">🎁 {cartItem.product.gift}</div>
                )}
              </div>

              <div className="co-card-price">
                <div className="co-price-current">
                  {formatMoneyCurrency(cartItem.product.price)}
                </div>
                {hasDiscount && (
                  <div className="co-price-original">
                    {currency}{" "}
                    {originalPrice.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                    <span className="co-discount-badge">
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

            {/* Card footer */}
            <div className="co-card-footer">
              <button
                className="co-remove-btn"
                onClick={() => removeCart(productId)}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                  <path d="M10 11v6M14 11v6" />
                  <path d="M9 6V4h6v2" />
                </svg>
                Remove
              </button>

              <div className="co-qty-control">
                <button
                  className="co-qty-btn"
                  onClick={() =>
                    onUpdateQuantity(productId, cartItem.quantity - 1)
                  }
                  disabled={cartItem.quantity <= 1}
                >
                  −
                </button>
                <span className="co-qty-num">{cartItem.quantity}</span>
                <button
                  className="co-qty-btn"
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

/* ─── PAYMENT SUMMARY ─── */
function PaymentSummary({ paymentSummary, loadCart }) {
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const [placing, setPlacing] = useState(false);

  const createOrder = async () => {
    setPlacing(true);
    try {
      await axios.post(`${BASE_URL}/api/orders`, {});
      await loadCart();
      navigate("/orders");
    } catch (err) {
      console.error("Failed to create order:", err);
      setPlacing(false);
    }
  };

  return (
    <div className="co-summary">
      <div className="co-summary-title">Payment Summary</div>

      {paymentSummary && (
        <>
          <div className="co-summary-breakdown">
            <div className="co-summary-row">
              <span>Items ({paymentSummary.totalItems})</span>
              <span>{formatMoneyCurrency(paymentSummary.productCost)}</span>
            </div>
            <div className="co-summary-row">
              <span>Shipping</span>
              <span>Free shipping</span>
            </div>
            <div className="co-summary-row">
              <span>Tax (10%)</span>
              <span>{formatMoneyCurrency(paymentSummary.tax)}</span>
            </div>
            <div className="co-summary-row co-summary-subtotal">
              <span>Total before tax</span>
              <span>{formatMoneyCurrency(paymentSummary.total)}</span>
            </div>
          </div>

          <div className="co-summary-row co-summary-total">
            <span>Order total</span>
            <span className="co-summary-amount">
              {formatMoneyCurrency(paymentSummary.total)}
            </span>
          </div>

          <button
            className={`co-place-btn ${placing ? "co-place-btn--loading" : ""}`}
            onClick={createOrder}
            disabled={placing}
          >
            {placing ? <span className="co-spinner" /> : "Place your order"}
          </button>

          <p className="co-summary-note">
            By placing your order you agree to our&nbsp;
            <a href="#">Terms & Conditions</a>.
          </p>
        </>
      )}
    </div>
  );
}

/* ─── CHECKOUT PAGE ─── */
export function CheckoutPage({
  cart,
  loadCart,
  deliveryOptions,
  onUpdateQuantity,
}) {
  const [paymentSummary, setPaymentSummary] = useState(null);

  const refreshSummary = async () => {
    await loadCart();
    const data = await getPaymentSummary();
    setPaymentSummary(data);
  };

  useEffect(() => {
    getPaymentSummary().then(setPaymentSummary);
  }, [cart]);

  const handleRemove = async (productId) => {
    try {
      await removeCartItem(productId);
      await loadCart();
    } catch (err) {
      console.error("Failed to remove item:", err);
    }
  };

  const totalItems = paymentSummary?.totalItems ?? 0;

  return (
    <>
      <title>Checkout</title>
      <CheckoutHeader totalItems={totalItems} />

      <div className="co-page">
        <div className="co-page-title">Review your order</div>

        <div className="co-grid">
          <OrderSummary
            cart={cart}
            deliveryOptions={deliveryOptions}
            onCartChange={refreshSummary}
            onUpdateQuantity={onUpdateQuantity}
            removeCart={handleRemove}
          />
          <PaymentSummary paymentSummary={paymentSummary} loadCart={loadCart} />
        </div>
      </div>
    </>
  );
}
