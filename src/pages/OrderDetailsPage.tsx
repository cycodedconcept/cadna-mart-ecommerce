import { useAppSelector } from "../app/hooks";
import AccountLayout from "../components/account/AccountLayout";
import OrdersFeedback from "../components/orders/OrdersFeedback";
import OrderStatusBadge from "../components/orders/OrderStatusBadge";
import { selectOrderById } from "../features/orders/slice";
import { formatOrderDate } from "../features/orders/types";
import { formatPrice } from "../data/home";

export default function OrderDetailsPage({ orderId }: { orderId: string }) {
  const order = useAppSelector((state) => selectOrderById(state, orderId));
  const ready = useAppSelector((state) => state.orders.status === "ready");
  return (
    <AccountLayout title="Order details" section="orders">
      <a className="orders-back" href="/account/orders">
        Back to order history
      </a>
      <OrdersFeedback />
      {ready &&
        (order ? (
          <article className="order-details">
            <div className="orders-heading">
              <div>
                <h2>{order.reference}</h2>
                <time dateTime={order.createdAt}>
                  {formatOrderDate(order.createdAt)}
                </time>
              </div>
              <OrderStatusBadge status={order.status} />
            </div>
            <p className="demo-notice">
              Demonstration only. No payment was collected and no delivery is
              arranged.
            </p>
            <section className="order-summary" aria-label="Purchased products">
              <h3>Purchased products</h3>
              <ul>
                {order.items.map((item) => (
                  <li key={item.productId}>
                    <img
                      className="order-product-image"
                      src={item.image}
                      alt={item.name}
                    />
                    <span>
                      {item.name}
                      <small>
                        {item.quantity} × {formatPrice(item.unitPrice / 100)} at
                        purchase
                      </small>
                    </span>
                    <strong>{formatPrice(item.total / 100)}</strong>
                  </li>
                ))}
              </ul>
              <dl className="order-totals">
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(order.subtotal / 100)}</dd>
                </div>
                <div>
                  <dt>Total</dt>
                  <dd>{formatPrice(order.total / 100)}</dd>
                </div>
              </dl>
              <p className="muted">
                No delivery charges, taxes or discounts were applied.
              </p>
            </section>
            <section className="delivery-info">
              <h3>Fictional delivery information</h3>
              <p>
                {order.delivery.address}, {order.delivery.city},{" "}
                {order.delivery.state}
              </p>
              <p>
                Entered contact and delivery details are not retained in order
                history.
              </p>
            </section>
          </article>
        ) : (
          <div className="empty-state">
            <h2>Order not found</h2>
            <p>This order is unavailable for the current demo account.</p>
            <a href="/account/orders">View your orders</a>
          </div>
        ))}
    </AccountLayout>
  );
}
