import axios from "axios";

// Get base URL from environment (dev or prod)
const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Build all endpoints from base URL
const API = `${BASE_URL}/api/products`;
const cartAPI = `${BASE_URL}/api/cart`;
const deliveryAPI = `${BASE_URL}/api/delivery-options`;
const paymentAPI = `${BASE_URL}/api/cart/payments`;
const orderAPI = `${BASE_URL}/api/orders?expand=product`;

export const getAllProducts = async () => {
  const response = await axios.get(API);
  return response.data; // IMPORTANT
};

export const getCartItems = async () => {
  const response = await axios.get(cartAPI);
  console.log(response);
  return response.data;
};

export const getDeliveryOption = async () => {
  const response = await axios.get(deliveryAPI);
  return response.data;
};
export const getPaymentSummary = async () => {
  const response = await axios.get(paymentAPI);
  return response.data;
};
export const getOrders = async () => {
  const response = await axios.get(orderAPI);
  return response.data;
};

export const updateOrderDelivery = async (orderId, deliveryOptionId) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/cart/${orderId}`, {
      deliveryOptionId: deliveryOptionId,
    });
    return response.data; // Should return the updated order
  } catch (error) {
    console.error("Error updating delivery option:", error);
    throw error;
  }
};

export const updateCartItemQuantity = async (productId, newQuantity) => {
  try {
    const response = await axios.put(`${BASE_URL}/api/cart/${productId}`, {
      productId: productId,
      quantity: newQuantity,
    });
    return response.data; // Should return the updated cart
  } catch (error) {
    console.error("Error updating delivery option:", error);
    throw error;
  }
};

export const removeCartItem = async (productId) => {
  try {
    const response = await axios.delete(`${BASE_URL}/api/cart/${productId}`);
    return response.data;
  } catch (error) {
    console.error("Error deleting cartItem : ", error);
  }
};
