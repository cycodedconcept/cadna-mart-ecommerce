import { browserStorage, type StorageAccess } from "../cart/persistence";
import {
  fictionalDelivery,
  orderStatuses,
  type OrderRecord,
  type OrderRepository,
} from "./types";

export const ORDERS_KEY = "cadna-orders-v1";
const integer = (value: unknown): value is number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const identifier = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9-]{1,100}$/.test(value);
const customerIdValid = (value: unknown) =>
  value === null ||
  (typeof value === "string" && /^demo-[a-f0-9]{64}$/.test(value));
function parseRecord(value: unknown): OrderRecord | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Partial<OrderRecord>;
  if (
    !identifier(record.id) ||
    record.id !== record.reference ||
    !customerIdValid(record.customerId) ||
    typeof record.createdAt !== "string" ||
    !Number.isFinite(Date.parse(record.createdAt))
  )
    return null;
  if (
    !orderStatuses.includes(record.status!) ||
    !integer(record.total) ||
    record.subtotal !== record.total ||
    !Array.isArray(record.items) ||
    !record.items.length ||
    record.items.length > 1000
  )
    return null;
  const items: OrderRecord["items"] = [];
  for (const value of record.items) {
    if (!value || typeof value !== "object") return null;
    const item = value as OrderRecord["items"][number];
    if (
      !integer(item.productId) ||
      typeof item.name !== "string" ||
      !item.name.trim() ||
      item.name.length > 500 ||
      typeof item.image !== "string" ||
      !/^\/images\/[A-Za-z0-9._-]+$/.test(item.image)
    )
      return null;
    if (
      !integer(item.quantity) ||
      item.quantity < 1 ||
      !integer(item.unitPrice) ||
      !integer(item.total) ||
      item.total !== item.quantity * item.unitPrice
    )
      return null;
    if (items.some((existing) => existing.productId === item.productId))
      return null;
    items.push({
      productId: item.productId,
      name: item.name,
      image: item.image,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.total,
    });
  }
  if (items.reduce((total, item) => total + item.total, 0) !== record.total)
    return null;
  return {
    id: record.id,
    reference: record.id,
    customerId: record.customerId!,
    createdAt: new Date(record.createdAt).toISOString(),
    status: record.status!,
    subtotal: record.total,
    total: record.total,
    items,
    delivery: { ...fictionalDelivery },
  };
}
interface StoredOrders {
  records: OrderRecord[];
  warning?: string;
}
function read(storage: StorageAccess): StoredOrders {
  const raw = storage.getItem(ORDERS_KEY);
  if (!raw) return { records: [] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { records: [], warning: "Unreadable demo order data was ignored." };
  }
  if (
    !data ||
    typeof data !== "object" ||
    !("version" in data) ||
    data.version !== 1 ||
    !("orders" in data) ||
    !Array.isArray(data.orders)
  ) {
    throw new Error(
      "Unsupported demo order storage. Clear the demo order storage to recover.",
    );
  }
  const records: OrderRecord[] = [];
  let invalid = false;
  for (const value of data.orders) {
    const record = parseRecord(value);
    if (!record || records.some((existing) => existing.id === record.id)) {
      invalid = true;
      continue;
    }
    records.push(record);
  }
  return {
    records,
    ...(invalid
      ? { warning: "Some invalid or duplicate demo orders were ignored." }
      : {}),
  };
}
export function createOrderRepository(
  getStorage: () => StorageAccess | undefined = browserStorage,
): OrderRepository {
  const storage = () => {
    const result = getStorage();
    if (!result)
      throw new Error(
        "Demo order storage is unavailable. Enable browser storage and retry.",
      );
    return result;
  };
  return {
    async list(customerId) {
      const { records, warning } = read(storage());
      return {
        orders: records.filter((order) => order.customerId === customerId),
        warning,
      };
    },
    async save(order) {
      const safe = parseRecord(order);
      if (!safe) throw new Error("The demo order could not be validated.");
      const target = storage();
      // Synchronous read/write is atomic within this tab; identical references are idempotent.
      const { records } = read(target);
      const existing = records.find((record) => record.id === safe.id);
      if (existing) {
        if (JSON.stringify(existing) !== JSON.stringify(safe))
          throw new Error("A conflicting demo order reference already exists.");
        return existing;
      }
      target.setItem(
        ORDERS_KEY,
        JSON.stringify({ version: 1, orders: [...records, safe] }),
      );
      return safe;
    },
  };
}
export const orderRepository = createOrderRepository();
