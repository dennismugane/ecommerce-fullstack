import { useEffect, useState, useRef } from "react";
import { getAllProducts } from "../../services/productService";
import { Header } from "../../components/Header";
import "./HomePage.css";
import { ProductGrid } from "./ProductGrid";
import { HomePageIntro } from "./HomePageIntro";
import { Categories } from "./Categories";
import { FeatureStrip } from "./FeatureStrip";
import { Deals } from "./Deals";

export function HomePage({ cart, loadCart }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const revealRefs = useRef([]);

  useEffect(() => {
    getAllProducts().then(({ products }) => {
      setProducts(products);
      setFilteredProducts(products);
    });
  }, []);

  // Scroll-triggered reveal
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("lp-visible");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealRefs.current.forEach((el) => el && obs.observe(el));
    return () => obs.disconnect();
  }, []);

  const addReveal = (el) => {
    if (el && !revealRefs.current.includes(el)) revealRefs.current.push(el);
  };

  const scrollToShop = () => {
    document
      .getElementById("shop-section")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <Header
        cart={cart}
        products={products}
        setFilteredProducts={setFilteredProducts}
      />

      <div className="home-page">
        {/* ── HERO ── */}
        <HomePageIntro scrollToShop={scrollToShop} />

        {/* ── CATEGORIES ── */}
        <Categories addReveal={addReveal} scrollToShop={scrollToShop} />

        {/* ── FEATURE STRIP ── */}
        <FeatureStrip />

        {/* ── DEALS HIGHLIGHT ── */}
        <Deals addReveal={addReveal} scrollToShop={scrollToShop} />

        {/* ── PRODUCT GRID (the real shop) ── */}
        <section id="shop-section" className="lp-shop-section">
          <div className="lp-section-tag lp-reveal" ref={addReveal}>
            Our products
          </div>
          <h2 className="lp-section-title lp-reveal" ref={addReveal}>
            Everything you need, in one place
          </h2>
          <ProductGrid products={filteredProducts} loadCart={loadCart} />
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="lp-testimonials">
          <div className="lp-section-tag lp-reveal" ref={addReveal}>
            Reviews
          </div>
          <h2
            className="lp-section-title lp-reveal"
            style={{ margin: "0 auto", textAlign: "center", maxWidth: "none" }}
            ref={addReveal}
          >
            What our customers say
          </h2>
          <div className="lp-t-grid">
            {[
              {
                quote:
                  "Ordered the toaster Tuesday morning and it was at my door by Wednesday. Packaging was brilliant and the product works perfectly. Will definitely shop here again!",
                name: "Amara O.",
                loc: "Nairobi, Kenya",
                bg: "#ffecd2",
                emoji: "😊",
              },
              {
                quote:
                  "Best prices I've found online. The basketball is great quality — my kids use it every day. The checkout process is so smooth and the cart updates instantly.",
                name: "Daniel K.",
                loc: "Mombasa, Kenya",
                bg: "#d4fc79",
                emoji: "🙂",
              },
              {
                quote:
                  "I love being able to track my orders in one place. The returns process was super easy too — no questions asked. A genuinely refreshing shopping experience.",
                name: "Fatuma M.",
                loc: "Kisumu, Kenya",
                bg: "#a8edea",
                emoji: "😄",
              },
            ].map((t) => (
              <div key={t.name} className="lp-t-card lp-reveal" ref={addReveal}>
                <p className="lp-t-quote">"{t.quote}"</p>
                <div className="lp-t-author">
                  <div className="lp-t-avatar" style={{ background: t.bg }}>
                    {t.emoji}
                  </div>
                  <div>
                    <div className="lp-t-name">{t.name}</div>
                    <div className="lp-t-loc">{t.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="lp-cta">
          <h2 className="lp-cta-title">Ready to start shopping?</h2>
          <p className="lp-cta-sub">
            Thousands of products. Unbeatable prices. Right at your fingertips.
          </p>
          <button className="lp-btn-white" onClick={scrollToShop}>
            Go to the Store
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </section>

        {/* ── FOOTER ── */}
        <footer className="lp-footer">
          <div className="lp-footer-brand">
            <div className="lp-footer-brand-name">SuperSimpleDev</div>
            <p>
              Your everyday online store — built with care, stocked with the
              best, and delivered with speed.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Shop</h4>
            <ul>
              <li>
                <button onClick={scrollToShop}>All Products</button>
              </li>
              <li>
                <button onClick={scrollToShop}>New Arrivals</button>
              </li>
              <li>
                <button onClick={scrollToShop}>Best Sellers</button>
              </li>
              <li>
                <button
                  onClick={() =>
                    document
                      .getElementById("lp-deals")
                      ?.scrollIntoView({ behavior: "smooth" })
                  }
                >
                  Today's Deals
                </button>
              </li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Account</h4>
            <ul>
              <li>
                <a href="/orders">My Orders</a>
              </li>
              <li>
                <a href="/checkout">My Cart</a>
              </li>
              <li>
                <a href="/tracking">Track Package</a>
              </li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Support</h4>
            <ul>
              <li>
                <a href="#">Help Center</a>
              </li>
              <li>
                <a href="#">Contact Us</a>
              </li>
              <li>
                <a href="#">Privacy Policy</a>
              </li>
            </ul>
          </div>
        </footer>
        <div className="lp-footer-bottom">
          <span>© 2026 SuperSimpleDev. All rights reserved.</span>
          <span>Made with ♥ for great shopping</span>
        </div>
      </div>
    </>
  );
}
