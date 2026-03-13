import { formatMoneyCurrency } from "../../utils/formatMoneyCurrency";
import dayjs from "dayjs";
export function OrderHeader({ order, selectedOption }) {
  return (
    <div className="op-order-header">
      <div className="op-order-header-grid">
        <div className="op-header-cell">
          <div className="op-header-label">Order Placed</div>
          <div className="op-header-value">
            {new Date(order.createdAt).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
        <div className="op-header-cell">
          <div className="op-header-label">Order Total</div>
          <div className="op-header-value op-header-value--green">
            {formatMoneyCurrency(order.total)}
          </div>
        </div>
        <div className="op-header-cell">
          <div className="op-header-label">Estimated Delivery</div>
          <div className="op-header-value">
            {selectedOption
              ? dayjs().add(selectedOption.days, "day").format("ddd, MMM D")
              : "—"}
          </div>
        </div>
        <div className="op-header-cell op-header-cell--right">
          <div className="op-header-label">Order ID</div>
          <div className="op-order-id">#{order.id}</div>
        </div>
      </div>
    </div>
  );
}
