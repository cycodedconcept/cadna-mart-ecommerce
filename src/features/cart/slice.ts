import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { products } from "../catalogue/data";
import type { Product } from "../catalogue/types";

export interface CartItem {
  productId: number;
  variantId: string;
  quantity: number;
}
export interface CartState {
  items: CartItem[];
}
export const itemKey = (item: Pick<CartItem, "productId" | "variantId">) =>
  JSON.stringify([item.productId, item.variantId]);
export const findProduct = (item: CartItem): Product =>
  products.find((product) => product.id === item.productId)!;
export const toMinor = (price: number) => Math.round(price * 100);
export const lineTotal = (item: CartItem) =>
  toMinor(findProduct(item).price) * item.quantity;
export const selectCartQuantity = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + item.quantity, 0);
export const selectCartTotal = (state: { cart: CartState }) =>
  state.cart.items.reduce((sum, item) => sum + lineTotal(item), 0);
const validQuantity = (quantity: number) =>
  Number.isSafeInteger(quantity) && quantity > 0;
export const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] } as CartState,
  reducers: {
    addItem(
      state,
      {
        payload,
      }: PayloadAction<{
        productId: number;
        variantId?: string;
        quantity?: number;
      }>,
    ) {
      const product = products.find((item) => item.id === payload.productId);
      const quantity = payload.quantity ?? 1;
      // The current catalogue has no variants. Unknown variants must not bypass stock limits.
      if (
        !product?.stock ||
        (payload.variantId && payload.variantId !== "default") ||
        !validQuantity(quantity)
      )
        return;
      const item = { productId: product.id, variantId: "default", quantity };
      const existing = state.items.find(
        (entry) => itemKey(entry) === itemKey(item),
      );
      if (existing)
        existing.quantity = Math.min(
          product.stock,
          existing.quantity + quantity,
        );
      else
        state.items.push({
          ...item,
          quantity: Math.min(product.stock, quantity),
        });
    },
    setQuantity(state, { payload }: PayloadAction<CartItem>) {
      const existing = state.items.find(
        (item) => itemKey(item) === itemKey(payload),
      );
      if (existing && validQuantity(payload.quantity))
        existing.quantity = Math.min(
          findProduct(existing).stock,
          payload.quantity,
        );
    },
    removeItem(state, { payload }: PayloadAction<string>) {
      state.items = state.items.filter((item) => itemKey(item) !== payload);
    },
    clearCart(state) {
      state.items = [];
    },
  },
});
export const { addItem, setQuantity, removeItem, clearCart } =
  cartSlice.actions;
