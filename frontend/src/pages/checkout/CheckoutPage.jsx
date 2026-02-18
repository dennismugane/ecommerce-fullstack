import { useEffect, useState } from 'react';
import './checkout-header.css';
import './CheckoutPage.css';
import { Header } from '../../components/Header';
import {  getPaymentSummary, removeCartItem } from '../../services/productService';
import { OrderSummary } from './OrderSummary';
import { PaymentSummary } from './PaymentSummary';

export function CheckoutPage({ cart, loadCart, deliveryOptions, onUpdateQuantity}) {
  const [paymentSummary, setPaymentSummary] = useState(null);
  // Define the refresh logic here in the parent
  const refreshSummary = async () => {
      // 1. Wait for the cart to update in App.jsx
      await loadCart();
      // 2. Then get the updated summary based on the new cart/shipping
      const summaryData = await getPaymentSummary();
      console.log("New Data from API:", summaryData); // Check if this matches $99.91
      setPaymentSummary(summaryData);
    };

    useEffect(() => {
      // Initial fetch of the summary
      getPaymentSummary().then(data => setPaymentSummary(data));
      
    }, [cart]); // Run once on mount

    // We add this to update the summary automatically if 'cart' changes 
    // from other sources (like a header delete)
    const handleRemoveCartItem = async (productId) => {

      try {
        await removeCartItem(productId);

        //refresh the cart state to show the new cart
        await loadCart();
      }catch (error) {
        console.error(" Failed to remove cartItem : ", error)
      }

    }

  return (
    <>
      <title>Checkout</title>
      <div className="checkout-header">
        <div className="header-content">
          <div className="checkout-header-left-section">
            <a href="/">
              <img className="logo" src="images/logo.png" />
              <img className="mobile-logo" src="images/mobile-logo.png" />
            </a>
          </div>

          <div className="checkout-header-middle-section">
            Checkout (<a className="return-to-home-link"
              href="/">{paymentSummary ? paymentSummary.totalItems : 0} items</a>)
          </div>
          <div className="checkout-header-right-section">
            <img src="images/icons/checkout-lock-icon.png" />
          </div>
        </div>
      </div>
      <div className="checkout-page">
        <div className="page-title">Review your order</div>
        <div className="checkout-grid">
        <OrderSummary 
          cart={cart} 
          deliveryOptions={deliveryOptions} 
          onCartChange={refreshSummary}
          onUpdateQuantity = {onUpdateQuantity}
          removeCart = {handleRemoveCartItem}
        />

          {/* PAYMENT SUMMARY */}
        <PaymentSummary paymentSummary={paymentSummary} loadCart = {loadCart}/>
        </div>
      </div>
    </>
  );
}