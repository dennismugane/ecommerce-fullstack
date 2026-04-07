export function HomePageIntro({ scrollToShop }) {
  return (
    <section className="lp-hero">
      <div className="lp-hero-text">
        <div className="lp-badge">
          <span className="lp-badge-dot" />
          New arrivals every week
        </div>
        <h1 className="lp-h1">
          Shop <em>smarter</em>,<br />
          live better.
        </h1>
        <p className="lp-sub">
          Your one-stop destination for everything you need — from everyday
          essentials to exciting finds, delivered fast to your door.
        </p>
        <div className="lp-actions">
          <button className="lp-btn-primary" onClick={scrollToShop}>
            Browse Products
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
          <button
            className="lp-btn-ghost"
            onClick={() =>
              document
                .getElementById("lp-deals")
                ?.scrollIntoView({ behavior: "smooth" })
            }
          >
            View Deals ↓
          </button>
        </div>
        <div className="lp-stats">
          <div>
            <div className="lp-stat-num">12K+</div>
            <div className="lp-stat-label">Products</div>
          </div>
          <div>
            <div className="lp-stat-num">98%</div>
            <div className="lp-stat-label">Satisfaction</div>
          </div>
          <div>
            <div className="lp-stat-num">24h</div>
            <div className="lp-stat-label">Fast delivery</div>
          </div>
        </div>
      </div>

      <div className="lp-hero-visual">
        <div className="lp-card-stack">
          <div className="lp-pcard">
            <span className="lp-pcard-emoji">🧦</span>
            <div className="lp-pcard-name">Athletic Cotton Socks</div>
            <div className="lp-pcard-price">Ksh 1,090</div>
            <div className="lp-pcard-stars">★★★★½ · 87</div>
          </div>
          <div className="lp-pcard">
            <span className="lp-pcard-emoji">🍞</span>
            <div className="lp-pcard-name">2-Slot Toaster White</div>
            <div className="lp-pcard-price">Ksh 1,899</div>
            <div className="lp-pcard-stars">★★★★★ · 2,197</div>
          </div>
          <div className="lp-pcard">
            <span className="lp-pcard-emoji">🏀</span>
            <div className="lp-pcard-name">Intermediate Basketball</div>
            <div className="lp-pcard-price">Ksh 2,095</div>
            <div className="lp-pcard-stars">★★★★☆ · 127</div>
          </div>
        </div>
      </div>
    </section>
  );
}
