import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  clearCart,
  findProduct,
  lineTotal,
  selectCartTotal,
  type CartState,
} from "../cart/slice";
import type { AuthState } from "../auth/types";
import { logout, selectCustomerId } from "../auth/slice";
import { createOrderRecord, type OrderRepository } from "../orders/types";
import { orderRepository } from "../orders/repository";
import { orderStored } from "../orders/slice";

export interface CustomerInfo {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  instructions: string;
}
export type CheckoutErrors = Partial<Record<keyof CustomerInfo, string>>;
export function validateCheckout(customer: CustomerInfo): CheckoutErrors {
  const errors: CheckoutErrors = {};
  for (const field of ["fullName", "address", "city", "state"] as const) {
    if (customer[field].trim().length < 2)
      errors[field] = "Enter at least 2 characters.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email.trim()))
    errors.email = "Enter a valid email address.";
  if (
    !/^\+?[\d\s()-]+$/.test(customer.phone.trim()) ||
    !/^\d{7,15}$/.test(customer.phone.replace(/\D/g, ""))
  )
    errors.phone = "Enter a valid phone number with 7–15 digits.";
  return errors;
}
export interface DemoOrder {
  historyOrderId?: string;
  customerId?: string | null;
  reference: string;
  customer: CustomerInfo;
  total: number;
  items: {
    productId: number;
    name: string;
    image: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}
export interface CheckoutState {
  status: "idle" | "submitting" | "success" | "error";
  error?: string;
  order?: DemoOrder;
}
export interface CheckoutServices {
  submit: (order: DemoOrder) => Promise<void>;
  reference: () => string;
  orders: OrderRepository;
}
export const demoServices: CheckoutServices = {
  submit: () => new Promise((resolve) => setTimeout(resolve, 650)),
  reference: () => `DEMO-${crypto.randomUUID()}`,
  orders: orderRepository,
};
export const submitCheckout = createAsyncThunk<
  DemoOrder,
  CustomerInfo,
  {
    state: { cart: CartState; checkout: CheckoutState; auth?: AuthState };
    extra: CheckoutServices;
  }
>(
  "checkout/submit",
  async (customer, { getState, dispatch, extra }) => {
    if (Object.keys(validateCheckout(customer)).length)
      throw new Error("Please correct the checkout fields.");
    const state = getState();
    const customerId = selectCustomerId(state);
    if (!state.cart.items.length) throw new Error("Your cart is empty.");
    const order: DemoOrder = {
      reference: extra.reference(),
      customer,
      total: selectCartTotal(state),
      items: state.cart.items.map((item) => {
        const product = findProduct(item);
        return {
          productId: product.id,
          name: product.name,
          image: product.images[0],
          quantity: item.quantity,
          unitPrice: Math.round(product.price * 100),
          total: lineTotal(item),
        };
      }),
    };
    await extra.submit(order);
    try {
      const record = await extra.orders.save(
        createOrderRecord(order, customerId),
      );
      order.historyOrderId = record.id;
      order.customerId = record.customerId;
      dispatch(orderStored(record));
    } catch {
      throw new Error(
        "Demo order could not be saved. Enable browser storage and retry.",
      );
    }
    dispatch(clearCart());
    return order;
  },
  {
    condition: (_, { getState }) => getState().checkout.status !== "submitting",
  },
);
export const checkoutSlice = createSlice({
  name: "checkout",
  initialState: { status: "idle" } as CheckoutState,
  reducers: {},
  extraReducers: (builder) =>
    builder
      .addCase(logout, (state) => {
        state.order = undefined;
      })
      .addCase(submitCheckout.pending, (state) => {
        state.status = "submitting";
        state.error = undefined;
        state.order = undefined;
      })
      .addCase(submitCheckout.fulfilled, (state, action) => {
        state.status = "success";
        state.order = action.payload;
      })
      .addCase(submitCheckout.rejected, (state, action) => {
        state.status = "error";
        state.error =
          action.error.message ?? "Demo submission failed. Please retry.";
      }),
});
