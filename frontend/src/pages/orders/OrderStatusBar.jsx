import "./OrderStatusBar.css";

const STEPS = ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED"];

const STEP_LABELS = {
  PENDING: { label: "Order Placed", icon: "📋" },
  PROCESSING: { label: "Processing", icon: "⚙️" },
  SHIPPED: { label: "Shipped", icon: "🚚" },
  DELIVERED: { label: "Delivered", icon: "✅" },
};

export function OrderStatusBar({ status }) {
  // CANCELLED gets its own treatment
  if (status === "CANCELLED") {
    return (
      <div className="osb-cancelled">
        <span>❌</span> This order was cancelled
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="osb-wrap">
      {STEPS.map((step, index) => {
        const isDone = index < currentIndex;
        const isCurrent = index === currentIndex;
        return (
          <div key={step} className="osb-step-wrap">
            {/* Connector line */}
            {index > 0 && (
              <div
                className={`osb-line ${isDone || isCurrent ? "osb-line--done" : ""}`}
              />
            )}

            {/* Step circle */}
            <div
              className={`osb-step ${isDone ? "osb-step--done" : ""} ${isCurrent ? "osb-step--current" : ""}`}
            >
              <span className="osb-step-icon">
                {isDone ? "✓" : STEP_LABELS[step].icon}
              </span>
            </div>

            {/* Label */}
            <div
              className={`osb-label ${isCurrent ? "osb-label--current" : ""}`}
            >
              {STEP_LABELS[step].label}
            </div>
          </div>
        );
      })}
    </div>
  );
}
