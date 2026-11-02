import type { OrderStatus } from "../../features/orders/types";
import { statusLabels } from "../../features/orders/types";

export default function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`order-status status-${status}`}
      aria-label={`Demo order status: ${statusLabels[status]}`}
    >
      {statusLabels[status]}
    </span>
  );
}
