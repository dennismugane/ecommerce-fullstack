import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const getAllProducts = async () => {
  const res = await axios.get(`${BASE_URL}/api/products`);
  return res.data;
};

export const getCartItems = async () => {
  const res = await axios.get(`${BASE_URL}/api/cart`);
  return res.data;
};

export const addToCart = async (productId, quantity = 1) => {
  const res = await axios.post(`${BASE_URL}/api/cart`, { productId, quantity });
  return res.data;
};

export const updateCartItemQuantity = async (productId, newQuantity) => {
  const res = await axios.put(`${BASE_URL}/api/cart/${productId}`, { quantity: newQuantity });
  return res.data;
};

export const removeCartItem = async (productId) => {
  const res = await axios.delete(`${BASE_URL}/api/cart/${productId}`);
  return res.data;
};

export const getDeliveryOption = async () => {
  const res = await axios.get(`${BASE_URL}/api/delivery-options`);
  return res.data;
};

export const getPaymentSummary = async () => {
  const res = await axios.get(`${BASE_URL}/api/cart/payments`);
  return res.data;
};

export const getOrders = async () => {
  const res = await axios.get(`${BASE_URL}/api/orders?expand=product`);
  return res.data;
};

// Fixed: was hitting /api/cart/:id — now correctly hits /api/orders/:orderId
export const updateOrderDelivery = async (orderId, deliveryOptionId) => {
  const res = await axios.put(`${BASE_URL}/api/orders/${orderId}`, { deliveryOptionId });
  return res.data;
};
