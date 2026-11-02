import { products } from "../catalogue/data";
import { itemKey, type CartState } from "./slice";

export const CART_KEY = "cadna-cart-v1";
export type StorageAccess = Pick<Storage, "getItem" | "setItem">;
export function browserStorage(): StorageAccess | undefined {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}
export function restoreCart(storage?: StorageAccess): CartState {
  const empty = { items: [] };
  try {
    const data: unknown = JSON.parse(storage?.getItem(CART_KEY) ?? "null");
    if (!Array.isArray(data)) return empty;
    const items: CartState["items"] = [];
    for (const entry of data) {
      if (!entry || typeof entry !== "object") continue;
      const product = products.find(
        (product) => product.id === entry.productId,
      );
      if (
        !product?.stock ||
        entry.variantId !== "default" ||
        !Number.isSafeInteger(entry.quantity) ||
        entry.quantity <= 0
      )
        continue;
      const item = {
        productId: product.id,
        variantId: "default",
        quantity: Math.min(product.stock, entry.quantity),
      };
      const existing = items.find(
        (existing) => itemKey(existing) === itemKey(item),
      );
      if (existing)
        existing.quantity = Math.min(
          product.stock,
          existing.quantity + item.quantity,
        );
      else items.push(item);
    }
    return { items };
  } catch {
    return empty;
  }
}
export function persistCart(cart: CartState, storage?: StorageAccess): boolean {
  try {
    if (!storage) return false;
    storage.setItem(CART_KEY, JSON.stringify(cart.items));
    return true;
  } catch {
    return false;
  }
}
