import type { DemoOrder } from "../checkout/slice";

export const orderStatuses = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof orderStatuses)[number];
export const statusLabels: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
export interface OrderRecord {
  id: string;
  customerId: string | null;
  reference: string;
  createdAt: string;
  items: DemoOrder["items"];
  subtotal: number;
  total: number;
  status: OrderStatus;
  delivery: { address: string; city: string; state: string };
}
// Persist only a fictional location; never the customer/contact fields entered at checkout.
export const fictionalDelivery = {
  address: "12 Demo Market Road",
  city: "Demo City",
  state: "Demo State",
};
export function createOrderRecord(
  order: DemoOrder,
  customerId: string | null,
  createdAt = new Date().toISOString(),
): OrderRecord {
  return {
    id: order.reference,
    reference: order.reference,
    customerId,
    createdAt,
    items: order.items.map((item) => ({ ...item })),
    subtotal: order.total,
    total: order.total,
    status: "pending",
    delivery: { ...fictionalDelivery },
  };
}
export interface OrderRepository {
  list(
    customerId: string,
  ): Promise<{ orders: OrderRecord[]; warning?: string }>;
  save(order: OrderRecord): Promise<OrderRecord>;
}
export const formatOrderDate = (date: string) =>
  new Intl.DateTimeFormat("en-NG", {
    dateStyle: "medium",
    timeZone: "Africa/Lagos",
  }).format(new Date(date));
