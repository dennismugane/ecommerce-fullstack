import axios from "axios";
import { useNavigate } from "react-router";

export function PaymentSummary({ paymentSummary, loadCart }) {
  const navigate = useNavigate();
  const createOrder = async () => {
    try {
      await axios.post(`/api/orders`);

      //reload the checkout page
      await loadCart();

      navigate("/orders");
    } catch (error) {
      console.error("Failed to create order : ", error);
    }
  };

  return (
    <div className="payment-summary">
      <div className="payment-summary-title">Payment Summary</div>
      {paymentSummary && (
        <>
          {/* <div className="payment-summary-row">
                        <div>Items:</div>
                        <div className="payment-summary-money">${paymentSummary.productCost}</div>
                    </div>

                    <div className="payment-summary-row">
                        <div>Shipping & handling:</div>
                        <div className="payment-summary-money">${paymentSummary.shippingCost}</div>
                    </div>

                    <div className="payment-summary-row subtotal-row">
                        <div>Total before tax:</div>
                        <div className="payment-summary-money">${paymentSummary.totalBeforeTax}</div>
                    </div>

                    <div className="payment-summary-row">
                        <div>Estimated tax:</div>
                        <div className="payment-summary-money">${paymentSummary.tax}</div>
                    </div> */}

          <div className="payment-summary-row total-row">
            <div>Order total:</div>
            <div className="payment-summary-money">
              Ksh{paymentSummary.total}
            </div>
          </div>

          <button
            className="place-order-button button-primary"
            onClick={createOrder}
          >
            Place your order
          </button>
        </>
      )}
    </div>
  );
}
