import { HomePage } from './pages/home/HomePage';
import { useState, useEffect } from 'react';
import { CheckoutPage } from './pages/checkout/CheckoutPage';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import { OrdersPage } from './pages/orders/OrdersPage';
import { TrackingPage } from './pages/TrackingPage';
import { getCartItems, getDeliveryOption, updateCartItemQuantity } from './services/productService';  // ← Add this

function App() {
  const [cart, setCart] = useState([]);
  const [deliveryOptions, setDeliveryOptions] = useState([]);  // ← Add state

  const loadCart = async () => {
    const data = await getCartItems();
    setCart(data);
    return data
  };

  const handleUpdateQuantity = async (ProductId, newQuantity) => {
    try{
      //1. call the API service to update quantity
      await updateCartItemQuantity (ProductId, newQuantity);

      //2. Referesh the cart state to show the new quantity
      await loadCart();
    }catch (error){
      console.error("Failed to update quantity : ", error)
    }

  }

  useEffect(() => {
    loadCart();

    // Fetch delivery options once
    getDeliveryOption().then(data => {
      setDeliveryOptions(data);
    }).catch(err => {
      console.error("Failed to load delivery options:", err);
      setDeliveryOptions([]); // fallback
    });
  }, []);

  return (
    <Routes>
      <Route index element={<HomePage cart={cart} loadCart={loadCart} />} />
      <Route path='checkout' element={<CheckoutPage cart={cart} loadCart={loadCart}
       deliveryOptions={deliveryOptions} onUpdateQuantity={handleUpdateQuantity}/>} />
      <Route 
        path='orders' 
        element={<OrdersPage cart={cart} deliveryOptions={deliveryOptions} />} 
      />
      <Route path='tracking' element={<TrackingPage cart={cart} />} />
    </Routes>
  );
}

export default App;