export function FeatureStrip() {
  return (
    <div className="lp-features">
      {[
        {
          icon: "🚚",
          title: "Fast Delivery",
          desc: "Same-day dispatch on orders placed before 2 PM",
        },
        {
          icon: "🔒",
          title: "Secure Checkout",
          desc: "Your payment info is always encrypted and safe",
        },
        {
          icon: "↩️",
          title: "Easy Returns",
          desc: "30-day hassle-free return policy on all items",
        },
        {
          icon: "⭐",
          title: "Top Rated",
          desc: "Thousands of verified reviews from real customers",
        },
      ].map((f) => (
        <div key={f.title} className="lp-feat">
          <div className="lp-feat-icon">{f.icon}</div>
          <div className="lp-feat-title">{f.title}</div>
          <div className="lp-feat-desc">{f.desc}</div>
        </div>
      ))}
    </div>
  );
}
