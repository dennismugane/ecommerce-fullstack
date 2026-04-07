import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "../../components/Header";
import { addToCart } from "../../services/productService";
import { formatMoneyCurrency } from "../../utils/formatMoneyCurrency";
import "./ProductDetailPage.css";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function StarRating({ rating, count }) {
  return (
    <div className="pd-stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`pd-star ${rating >= star ? "pd-star--full" : rating >= star - 0.5 ? "pd-star--half" : ""}`}
          viewBox="0 0 24 24"
          width="18"
          height="18"
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
      <span className="pd-rating-count">
        ({count?.toLocaleString()} reviews)
      </span>
    </div>
  );
}

export function ProductDetailPage({ cart, loadCart }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch(`${BASE_URL}/api/products/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Product not found.");
        setLoading(false);
      });
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(product.id, quantity);
      await loadCart();
      setAdded(true);
      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error("Failed to add to cart:", err);
    } finally {
      setAdding(false);
    }
  };

  if (loading)
    return (
      <>
        <Header cart={cart} />
        <div className="pd-page">
          <div className="pd-skeleton">
            <div className="pd-skeleton-img" />
            <div className="pd-skeleton-info">
              <div className="pd-skeleton-line pd-skeleton-line--title" />
              <div className="pd-skeleton-line" />
              <div className="pd-skeleton-line pd-skeleton-line--short" />
            </div>
          </div>
        </div>
      </>
    );

  if (error)
    return (
      <>
        <Header cart={cart} />
        <div className="pd-page pd-error-wrap">
          <div className="pd-error-box">
            <span className="pd-error-icon">🔍</span>
            <h2>Product not found</h2>
            <p>This product may have been removed or doesn't exist.</p>
            <button className="pd-back-btn" onClick={() => navigate("/")}>
              ← Back to Shop
            </button>
          </div>
        </div>
      </>
    );

  const currency = product.currency || "KSh";

  return (
    <>
      <Header cart={cart} />
      <div className="pd-page">
        {/* Breadcrumb */}
        <nav className="pd-breadcrumb">
          <button onClick={() => navigate("/")}>Home</button>
          <span>/</span>
          <button
            onClick={() => {
              navigate("/");
              setTimeout(
                () =>
                  document
                    .getElementById("shop-section")
                    ?.scrollIntoView({ behavior: "smooth" }),
                100,
              );
            }}
          >
            Shop
          </button>
          <span>/</span>
          <span>{product.name}</span>
        </nav>

        <div className="pd-grid">
          {/* Left — image */}
          <div className="pd-img-col">
            <div className="pd-img-wrap">
              <img
                src={`${BASE_URL}/${product.image}`}
                alt={product.name}
                className="pd-img"
              />
            </div>
          </div>

          {/* Right — info */}
          <div className="pd-info-col">
            <div className="pd-badge">In Stock</div>

            <h1 className="pd-name">{product.name}</h1>

            {product.rating > 0 && (
              <StarRating rating={product.rating} count={product.ratingCount} />
            )}

            <div className="pd-price">
              {formatMoneyCurrency(product.price, currency)}
            </div>

            {product.description && (
              <div className="pd-description">
                <div className="pd-description-title">About this product</div>
                <p>{product.description}</p>
              </div>
            )}

            {/* Quantity selector */}
            <div className="pd-qty-row">
              <span className="pd-qty-label">Quantity</span>
              <div className="pd-qty-control">
                <button
                  className="pd-qty-btn"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <span className="pd-qty-num">{quantity}</span>
                <button
                  className="pd-qty-btn"
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <button
              className={`pd-add-btn ${added ? "pd-add-btn--added" : ""}`}
              onClick={handleAddToCart}
              disabled={adding || added}
            >
              {adding ? (
                <>
                  <span className="pd-btn-spinner" /> Adding…
                </>
              ) : added ? (
                <>✓ Added to Cart</>
              ) : (
                <>
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                  </svg>
                  Add to Cart
                </>
              )}
            </button>

            <button
              className="pd-checkout-btn"
              onClick={async () => {
                await handleAddToCart();
                navigate("/checkout");
              }}
            >
              Buy Now
            </button>

            {/* Meta */}
            <div className="pd-meta">
              {product.sku && (
                <div className="pd-meta-row">
                  <span>SKU</span>
                  <span>{product.sku}</span>
                </div>
              )}
              <div className="pd-meta-row">
                <span>Delivery</span>
                <span>2–7 business days</span>
              </div>
              <div className="pd-meta-row">
                <span>Returns</span>
                <span>30-day easy returns</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
