import { useAppSelector } from "../app/hooks";
import { formatPrice } from "../data/home";
import { selectCustomerId } from "../features/auth/slice";

export default function ConfirmationPage() {
  const order = useAppSelector((state) => state.checkout.order);
  const customerId = useAppSelector(selectCustomerId);
  if (!order || (order.customerId && order.customerId !== customerId))
    return (
      <div className="empty-state">
        <h1>No demo confirmation available</h1>
        <p>Confirmations are available during this visit only.</p>
        <a href="/catalogue">Continue shopping</a>
      </div>
    );
  return (
    <section className="confirmation">
      <p className="eyebrow">DEMONSTRATION COMPLETE</p>
      <h1>Thank you, {order.customer.fullName}!</h1>
      <p className="demo-notice">
        Your demo order is complete. This has not been placed with a live
        backend. No payment has been taken and no delivery will be arranged.
      </p>
      <h2>Order reference</h2>
      <p className="order-reference">{order.reference}</p>
      <div className="purchase-layout">
        <section className="order-summary">
          <h2>Order details</h2>
          <ul>
            {order.items.map((item) => (
              <li key={item.productId}>
                <img src={item.image} alt="" width="60" height="60" />
                <span>
                  {item.name}
                  <small>
                    {item.quantity} × {formatPrice(item.unitPrice / 100)}
                  </small>
                </span>
                <strong>{formatPrice(item.total / 100)}</strong>
              </li>
            ))}
          </ul>
          <dl className="order-totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.total / 100)}</dd>
            </div>
            <div>
              <dt>Total</dt>
              <dd>{formatPrice(order.total / 100)}</dd>
            </div>
          </dl>
        </section>
        <section className="delivery-info">
          <h2>Customer & delivery details</h2>
          <p>{order.customer.fullName}</p>
          <p>{order.customer.email}</p>
          <p>{order.customer.phone}</p>
          <p>
            {order.customer.address}, {order.customer.city},{" "}
            {order.customer.state}
          </p>
          {order.customer.instructions && (
            <p>Instructions: {order.customer.instructions}</p>
          )}
        </section>
      </div>
      {order.customerId && (
        <a
          className="primary-button checkout-link"
          href={`/account/orders/${order.historyOrderId}`}
        >
          View saved order
        </a>
      )}
      <a className="primary-button checkout-link" href="/catalogue">
        Continue shopping
      </a>
    </section>
  );
}
