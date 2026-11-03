import { formatPrice } from "../../data/home";
import { formatOrderDate, type OrderRecord } from "../../features/orders/types";
import OrderStatusBadge from "./OrderStatusBadge";

export default function OrderList({ orders }: { orders: OrderRecord[] }) {
  return (
    <ul className="order-list">
      {orders.map((order) => (
        <li className="order-card" key={order.id}>
          <div>
            <h3>
              <a href={`/account/orders/${order.id}`}>{order.reference}</a>
            </h3>
            <time dateTime={order.createdAt}>
              {formatOrderDate(order.createdAt)}
            </time>
            <p>
              {order.items.reduce((count, item) => count + item.quantity, 0)}{" "}
              items
            </p>
          </div>
          <OrderStatusBadge status={order.status} />
          <strong>{formatPrice(order.total / 100)}</strong>
          <a
            className="clear-button"
            href={`/account/orders/${order.id}`}
            aria-label={`View details for ${order.reference}`}
          >
            View details
          </a>
        </li>
      ))}
    </ul>
  );
}
