import { HomePage } from './pages/home/HomePage';
import { useState, useEffect } from 'react';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { OrdersPage } from './pages/orders/OrdersPage';
import { TrackingPage } from './pages/TrackingPage';
import { AuthPage } from './pages/auth/AuthPage';
import { ProductDetailPage } from './pages/product/ProductDetailPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getCartItems, getDeliveryOption, updateCartItemQuantity } from './services/productService';
import { getToken } from './services/authService';
import axios from 'axios';

function App() {
  const [cart, setCart]               = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [authReady, setAuthReady]     = useState(false);

  useEffect(() => {
    const reqId = axios.interceptors.request.use((config) => {
      const token = getToken();
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    const resId = axios.interceptors.response.use(
      (res) => res,
      (err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    );

    setAuthReady(true);
    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, []);

  const loadCart = async () => {
    try {
      const data = await getCartItems();
      setCart(data);
      return data;
    } catch { return []; }
  };

  const handleUpdateQuantity = async (productId, newQuantity) => {
    try {
      await updateCartItemQuantity(productId, newQuantity);
      await loadCart();
    } catch (err) {
      console.error('Failed to update quantity:', err);
    }
  };

  useEffect(() => {
    if (!authReady) return;
    if (getToken()) loadCart();
    getDeliveryOption().then(setDeliveryOptions).catch(() => setDeliveryOptions([]));
  }, [authReady]);

  if (!authReady) return null;

  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<AuthPage />} />
      <Route index element={<HomePage cart={cart} loadCart={loadCart} />} />

      {/* Product detail — public so anyone can browse */}
      <Route path="/products/:id" element={<ProductDetailPage cart={cart} loadCart={loadCart} />} />

      {/* Protected */}
      <Route path="checkout" element={
        <ProtectedRoute>
          <CheckoutPage cart={cart} loadCart={loadCart} deliveryOptions={deliveryOptions} onUpdateQuantity={handleUpdateQuantity} />
        </ProtectedRoute>
      } />
      <Route path="orders" element={
        <ProtectedRoute>
          <OrdersPage cart={cart} deliveryOptions={deliveryOptions} />
        </ProtectedRoute>
      } />
      <Route path="tracking" element={
        <ProtectedRoute>
          <TrackingPage cart={cart} />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
