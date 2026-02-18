import './OrdersPage.css';
import '../home/HomePage.css';
import { Header } from '../../components/Header';
import { useEffect, useState } from 'react';  // ← Removed Fragment (we use <> shorthand)
import { getOrders, updateOrderDelivery } from '../../services/productService';
import { OrderHeader } from './orderHeader';
import { Link } from 'react-router-dom';       // ← CORRECT: from react-router-dom
import dayjs from 'dayjs';

export function OrdersPage({ cart, deliveryOptions }) {
  const [orders, setOrders] = useState([]);
  const [selectedDelivery, setSelectedDelivery] = useState({});
  const [loading, setLoading] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getOrders();
        setOrders(data);

        const initial = {};
        data.forEach((order) => {
          initial[order.id] = order.deliveryOptionId || deliveryOptions[0]?.id;
        });
        setSelectedDelivery(initial);
      } catch (error) {
        console.error('Failed to load orders:', error);
      }
    };

    fetchOrders();
  }, [deliveryOptions]);

  const handleDeliveryChange = async (orderId, deliveryOptionId) => {
    const originalDeliveryId = orders.find((o) => o.id === orderId)?.deliveryOptionId;

    setSelectedDelivery((prev) => ({ ...prev, [orderId]: deliveryOptionId }));
    setLoading((prev) => ({ ...prev, [orderId]: true }));

    try {
      const updatedOrder = await updateOrderDelivery(orderId, deliveryOptionId);

      setOrders((prevOrders) =>
        prevOrders.map((o) => (o.id === orderId ? updatedOrder : o))
      );
    } catch (error) {
      console.error('Failed to update delivery option:', error);
      alert('Failed to update delivery option. Please try again.');

      setSelectedDelivery((prev) => ({
        ...prev,
        [orderId]: originalDeliveryId || deliveryOptions[0]?.id,
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [orderId]: false }));
    }
  };

  return (
    <>
      <title>Orders</title>
      <Header cart={cart} />

      <div className="orders-page">
        <div className="page-title">Your Orders</div>

        <div className="orders-grid">
          {orders.map((order) => {
            const currentDeliveryId = selectedDelivery[order.id];
            const selectedOption = deliveryOptions.find((opt) => opt.id === currentDeliveryId);

            return (
              <div key={order.id} className="order-container">
                <OrderHeader order={order} selectedOption={selectedOption} />

                {/* Delivery options – once per order */}
                <div className="delivery-options order-level-delivery">
                  <div className="delivery-options-title">Choose a delivery option:</div>
                  {deliveryOptions.map((option) => (
                    <div key={option.id} className="delivery-option">
                      <input
                        type="radio"
                        className="delivery-option-input"
                        name={`delivery-order-${order.id}`}
                        checked={currentDeliveryId === option.id}
                        onChange={() => handleDeliveryChange(order.id, option.id)}
                        disabled={loading[order.id]}
                      />
                      <div>
                        <div className="delivery-option-date">
                          {dayjs().add(option.days, 'day').format('dddd, MMMM DD')}
                        </div>
                        <div className="delivery-option-price">
                          {option.cost === 0
                            ? 'FREE Shipping'
                            : `Ksh ${option.cost.toFixed(2)} - Shipping`}
                        </div>
                      </div>
                    </div>
                  ))}
                  {loading[order.id] && <div className="loading-text">Updating...</div>}
                </div>

                {/* Items in the order */}
                <div className="order-details-grid">
                  {order.items.map((item) => (
                    <div key={item.product.id} className="order-item-row">
                      <div className="product-image-container">
                        <img src={item.product.image} alt={item.product.name} />
                      </div>

                      <div className="order-item-info">
                        <div className="product-name">{item.product.name}</div>
                        <div className="product-quantity">Qty: {item.quantity}</div>
                      </div>

                      <div className="order-item-actions">
                        {/* future actions like Track / Buy again */}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}