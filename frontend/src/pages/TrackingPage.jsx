import './home/HomePage.css';
import './TrackingPage.css';
import { Header } from '../components/Header';
import { getOrders } from '../services/productService';
import { useSearchParams } from 'react-router';
import {useState, useEffect } from 'react';

export function TrackingPage() {
    const [searchParams] = useSearchParams();
    const [trackingInfo, setTrackingInfo] = useState(null);
    const [parentOrder, setParentOrder] = useState(null);

    const orderId = searchParams.get('orderId');
    const productId = searchParams.get('productId');

    useEffect(() => {
        getOrders().then((orders) => {
            console.log("All Orders from API:", orders);
            console.log("Searching for OrderID:", orderId, "and ProductID:", productId);

            const order = orders.find(o => String(o.id) === String(orderId));
            console.log("Found Order:", order);

            if (order) {
                const item = order.items.find(i => String(i.product.id) === String(productId));
                console.log("Found Item:", item);
                setTrackingInfo(item);
                setParentOrder(order);
            }
        });
    }, [orderId, productId]);

    if (!trackingInfo) return <div>Loading tracking details...</div>;

    //The logic to track progress we compare the difference btn orderDate(createdAt) and deliveryDate 
    //against curreent Date.
    const orderTime = new Date(parentOrder.createdAt).getTime();
    const deliveryTime = new Date(trackingInfo.deliveryDate).getTime();
    const currentTime = new Date().getTime();
    
    // 2. Calculate percentage
    // Formula: (Current - Start) / (End - Start)
    const totalDuration = deliveryTime - orderTime;
    const timeElapsed = currentTime - orderTime;

    let percentageProgess = (timeElapsed/ totalDuration) * 100;

    if (percentageProgess < 0 ) percentageProgess = 0;
    if ( percentageProgess > 100) percentageProgess =100;

    // 4. Determine status label highlight
    // Preparing: 0-49%, Shipped: 50-99%, Delivered: 100%
    const isPreparing = percentageProgess < 50;
    const isShipping = percentageProgess >= 50 && percentageProgess <= 99;
    const isDelivered = percentageProgess === 100;

    return (
        <>
          <title>Tracking</title>
          <Header />
            <div className="tracking-page">
                <div className="order-tracking">
                    <a className="back-to-orders-link link-primary" href="/orders">
                        View all orders
                    </a>
        
                    <div className="delivery-date">
                        Arriving on: {new Date(trackingInfo.deliveryDate).toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>

                    <div className="product-info">
                        {trackingInfo.product.name}
                    </div>

                    <div className="product-info">
                        Quantity: {trackingInfo.quantity}
                    </div>

                    <img className="product-image" src={trackingInfo.product.image} />

                    <div className="progress-labels-container">
                        <div className={`progress-label ${isPreparing ? 'current-status' : ''}`}>
                            Preparing
                        </div>
                        <div className={`progress-label ${isShipping ? 'current-status' : ''}`}>
                            Shipped
                        </div>
                        <div className={`progress-label ${isDelivered ? 'current-status' : ''}`}>
                            Delivered
                        </div>
                    </div>

                    <div className="progress-bar-container">
                        <div className="progress-bar" style={{ width: `${percentageProgess}%` }}></div>
                    </div>
                </div>
            </div>
        </>

    );

}