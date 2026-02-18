import dayjs from "dayjs";
export function OrderHeader({ order, selectedOption }) {

    return (
        <div className="order-header">
            <div className="order-header-left-section">
                <div className="order-date">
                    <div className="order-header-label">Order Placed:</div>
                    <div>{new Date(order.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}</div>
                </div>
                <div className="order-total">
                    <div className="order-header-label">Total:</div>
                    <div>Ksh {order.total.toFixed(2)}</div>
                </div>
            </div>

            <div className="order-header-right-section">
                <div className="delivery-date">
                    {selectedOption
                        ? dayjs().add(selectedOption.days, 'day').format('dddd, MMMM DD')
                        : 'Calculating...'}
                </div>
                <div className="order-header-label">Order ID:</div>
                <div>{order.id}</div>
            </div>
        </div>

    );
}