export function Categories({ addReveal, scrollToShop }) {
  return (
    <section className="lp-section">
      <div className="lp-section-tag lp-reveal" ref={addReveal}>
        Categories
      </div>
      <h2 className="lp-section-title lp-reveal" ref={addReveal}>
        Find exactly what you're looking for
      </h2>
      <div className="lp-cats">
        {[
          { icon: "👕", name: "Clothing", count: "340+" },
          { icon: "🏅", name: "Sports", count: "210+" },
          { icon: "🏠", name: "Home & Kitchen", count: "520+" },
          { icon: "💻", name: "Electronics", count: "185+" },
        ].map((cat) => (
          <button
            key={cat.name}
            className="lp-cat lp-reveal"
            ref={addReveal}
            onClick={scrollToShop}
          >
            <span className="lp-cat-icon">{cat.icon}</span>
            <div className="lp-cat-name">{cat.name}</div>
            <div className="lp-cat-count">{cat.count} items</div>
            <div className="lp-cat-arrow">→</div>
          </button>
        ))}
      </div>
    </section>
  );
}
