import "./OrdersPage.css";
import { Header } from "../../components/Header";
import { useEffect, useState } from "react";
import { getOrders, updateOrderDelivery } from "../../services/productService";
import { OrderStatusBar } from "./OrderStatusBar";
import { OrderHeader } from "./orderHeader";
import dayjs from "dayjs";
import {
  OrderFormatMoneyCurrency,
  formatMoneyCurrency,
} from "../../utils/formatMoneyCurrency";

export function OrdersPage({ cart, deliveryOptions }) {
  const [orders, setOrders] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [loading, setLoading] = useState({});
  const BASE_URL = import.meta.env.VITE_API_BASE_URL;

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);
        const initial = {};
        data.forEach((o) => {
          initial[o.id] = o.deliveryOptionId || deliveryOptions[0]?.id;
        });
        setSelectedDelivery(initial);
      } catch (err) {
        console.error("Failed to load orders:", err);
      }
    };
    fetchOrders();
  }, [deliveryOptions]);

  const handleDeliveryChange = async (orderId, deliveryOptionId) => {
    const originalId = orders.find((o) => o.id === orderId)?.deliveryOptionId;
    setSelectedDelivery((prev) => ({ ...prev, [orderId]: deliveryOptionId }));
    setLoading((prev) => ({ ...prev, [orderId]: true }));
    try {
      const updated = await updateOrderDelivery(orderId, deliveryOptionId);
      setOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
    } catch {
      alert("Failed to update delivery option.");
      setSelectedDelivery((prev) => ({
        ...prev,
        [orderId]: originalId || deliveryOptions[0]?.id,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <>
      <title>Orders</title>
      <Header cart={cart} />

      <div className="op-page">
        <div className="op-page-title">Your Orders</div>

        {orders.length === 0 ? (
          <div className="op-empty">
            <div className="op-empty-icon">📦</div>
            <div className="op-empty-title">No orders yet</div>
            <div className="op-empty-sub">
              When you place an order it will appear here.
            </div>
            <a href="/" className="op-empty-btn">
              Start Shopping →
            </a>
          </div>
        ) : (
          <div className="op-orders-list">
            {orders.map((order) => {
              const currentDeliveryId = selectedDelivery[order.id];
              const selectedOption = deliveryOptions.find(
                (o) => o.id === currentDeliveryId,
              );

              return (
                <div key={order.id} className="op-order-card">
                  <OrderHeader order={order} selectedOption={selectedOption} />

                  {/* ── Status progress bar ── */}
                  <div className="op-status-section">
                    <div className="op-status-label">Order Status</div>
                    <OrderStatusBar status={order.status || "PENDING"} />
                  </div>

                  <div className="op-order-body">
                    {/* Items */}
                    <div className="op-items-col">
                      {order.items?.map((item) => (
                        <div key={item.product.id} className="op-item-row">
                          <div className="op-item-img-wrap">
                            <img
                              src={`${BASE_URL}/${item.product.image}`}
                              alt={item.product.name}
                              className="op-item-img"
                            />
                          </div>
                          <div className="op-item-info">
                            <div className="op-item-name">
                              {item.product.name}
                            </div>
                            <div className="op-item-qty">
                              Qty: {item.quantity}
                            </div>
                          </div>
                          <div className="op-item-price">
                            {formatMoneyCurrency(item.product.price)}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Delivery options */}
                    <div className="op-delivery-col">
                      <div className="op-delivery-title">Choose delivery</div>
                      {deliveryOptions.map((option) => {
                        const isSelected = currentDeliveryId === option.id;
                        return (
                          <label
                            key={option.id}
                            className={`op-delivery-option ${isSelected ? "op-delivery-option--selected" : ""}`}
                          >
                            <input
                              type="radio"
                              name={`delivery-${order.id}`}
                              checked={isSelected}
                              onChange={() =>
                                handleDeliveryChange(order.id, option.id)
                              }
                              disabled={loading[order.id]}
                              className="op-delivery-radio"
                            />
                            <div className="op-delivery-info">
                              <div className="op-delivery-date">
                                {dayjs()
                                  .add(option.days, "day")
                                  .format("ddd, MMM D")}
                              </div>
                              <div className="op-delivery-cost">
                                {option.cost === 0 ? (
                                  <span className="op-free">FREE Shipping</span>
                                ) : (
                                  formatMoneyCurrency(option.cost)
                                )}
                              </div>
                            </div>
                            {isSelected && (
                              <span className="op-delivery-check">✓</span>
                            )}
                          </label>
                        );
                      })}
                      {loading[order.id] && (
                        <div className="op-updating">
                          <span className="op-spinner" /> Updating…
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
