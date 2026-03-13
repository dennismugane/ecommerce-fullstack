export function Deals({ addReveal, scrollToShop }) {
  return (
    <section className="lp-deals" id="lp-deals">
      <div className="lp-deals-hd">
        <div>
          <div className="lp-section-tag lp-reveal" ref={addReveal}>
            Hot right now
          </div>
          <h2
            className="lp-section-title lp-reveal"
            style={{ marginBottom: 0 }}
            ref={addReveal}
          >
            Today's best deals
          </h2>
        </div>
        <button className="lp-deals-link" onClick={scrollToShop}>
          See all deals →
        </button>
      </div>
      <div className="lp-deals-grid">
        {[
          {
            emoji: "🍞",
            bg: "linear-gradient(135deg,#ffecd2,#fcb69f)",
            name: "2 Slot Toaster – White",
            badge: "-15%",
            newP: "Ksh 1,614",
            oldP: "Ksh 1,899",
            stars: "★★★★★ 2,197 reviews",
          },
          {
            emoji: "🏀",
            bg: "linear-gradient(135deg,#d4fc79,#96e6a1)",
            name: "Intermediate Size Basketball",
            badge: "-10%",
            newP: "Ksh 1,886",
            oldP: "Ksh 2,095",
            stars: "★★★★☆ 127 reviews",
          },
          {
            emoji: "🍽️",
            bg: "linear-gradient(135deg,#a8edea,#fed6e3)",
            name: "2 Piece White Dinner Plate Set",
            badge: "-20%",
            newP: "Ksh 1,654",
            oldP: "Ksh 2,067",
            stars: "★★★★½ 37 reviews",
          },
        ].map((deal) => (
          <button
            key={deal.name}
            className="lp-deal lp-reveal"
            ref={addReveal}
            onClick={scrollToShop}
          >
            <div className="lp-deal-img" style={{ background: deal.bg }}>
              {deal.emoji}
              <span className="lp-deal-badge">{deal.badge}</span>
            </div>
            <div className="lp-deal-body">
              <div className="lp-deal-name">{deal.name}</div>
              <div className="lp-deal-prices">
                <span className="lp-deal-new">{deal.newP}</span>
                <span className="lp-deal-old">{deal.oldP}</span>
              </div>
              <div className="lp-deal-stars">{deal.stars}</div>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
