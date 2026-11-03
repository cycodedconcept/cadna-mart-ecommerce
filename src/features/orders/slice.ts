import {
  createAsyncThunk,
  createSelector,
  createSlice,
  type PayloadAction,
} from "@reduxjs/toolkit";
import { authSlice, logout, selectCustomerId } from "../auth/slice";
import type { AuthState } from "../auth/types";
import type { OrderRecord, OrderRepository, OrderStatus } from "./types";

export interface OrdersState {
  items: OrderRecord[];
  customerId: string | null;
  status: "idle" | "loading" | "ready" | "error";
  error?: string;
  warning?: string;
  requestId?: string;
}
type State = { auth?: AuthState; orders?: OrdersState };
const initialState: OrdersState = {
  items: [],
  customerId: null,
  status: "idle",
};
export const loadOrders = createAsyncThunk<
  { orders: OrderRecord[]; warning?: string; customerId: string },
  void,
  {
    state: State;
    extra: { orders: OrderRepository };
  }
>(
  "orders/load",
  async (_, { getState, extra }) => {
    const customerId = selectCustomerId(getState());
    if (!customerId) throw new Error("Sign in to view your demo orders.");
    return { ...(await extra.orders.list(customerId)), customerId };
  },
  { condition: (_, { getState }) => getState().orders?.status !== "loading" },
);
export const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    orderStored(state, { payload }: PayloadAction<OrderRecord>) {
      if (!payload.customerId || payload.customerId !== state.customerId)
        return;
      if (!state.items.some((order) => order.id === payload.id))
        state.items.push(payload);
    },
  },
  extraReducers: (builder) =>
    builder
      .addCase(logout, () => initialState)
      .addCase(authSlice.actions.succeeded, (state, action) => {
        if (
          action.payload.customerId &&
          action.payload.customerId !== state.customerId
        )
          return { ...initialState, customerId: action.payload.customerId };
      })
      .addCase(loadOrders.pending, (state, action) => {
        state.status = "loading";
        state.requestId = action.meta.requestId;
        state.error = undefined;
      })
      .addCase(loadOrders.fulfilled, (state, action) => {
        if (
          state.requestId !== action.meta.requestId ||
          state.customerId !== action.payload.customerId
        )
          return;
        // Preserve checkouts completed while the repository read was in flight.
        const items = [...action.payload.orders];
        for (const order of state.items)
          if (!items.some((item) => item.id === order.id)) items.push(order);
        state.items = items.filter(
          (order) => order.customerId === state.customerId,
        );
        state.status = "ready";
        state.warning = action.payload.warning;
        state.requestId = undefined;
      })
      .addCase(loadOrders.rejected, (state, action) => {
        if (state.requestId !== action.meta.requestId) return;
        state.status = "error";
        state.error =
          "We could not load demo orders. Check browser storage and try again.";
        state.requestId = undefined;
      }),
});
export const { orderStored } = ordersSlice.actions;
const selectOrdersState = (state: State) => state.orders ?? initialState;
export const selectCustomerOrders = createSelector(
  [selectOrdersState, selectCustomerId],
  (orders, customerId) =>
    customerId && customerId === orders.customerId
      ? orders.items.filter((order) => order.customerId === customerId)
      : [],
);
export const selectOrderById = (state: State, id: string) =>
  selectCustomerOrders(state).find((order) => order.id === id);
export interface OrderQuery {
  search: string;
  status: OrderStatus | "";
  sort: "newest" | "oldest" | "total-asc" | "total-desc";
}
export function queryOrders(
  orders: OrderRecord[],
  query: OrderQuery,
): OrderRecord[] {
  const search = query.search.trim().toLowerCase();
  return orders
    .filter(
      (order) =>
        (!query.status || order.status === query.status) &&
        (!search ||
          order.reference.toLowerCase().includes(search) ||
          order.items.some((item) => item.name.toLowerCase().includes(search))),
    )
    .sort(
      (a, b) =>
        (query.sort === "total-asc"
          ? a.total - b.total
          : query.sort === "total-desc"
            ? b.total - a.total
            : query.sort === "oldest"
              ? Date.parse(a.createdAt) - Date.parse(b.createdAt)
              : Date.parse(b.createdAt) - Date.parse(a.createdAt)) ||
        a.id.localeCompare(b.id),
    );
}
export const selectFilteredOrders = createSelector(
  [selectCustomerOrders, (_: State, query: OrderQuery) => query],
  queryOrders,
);
export const selectOrderSummary = createSelector(
  [selectCustomerOrders],
  (orders) => ({
    total: orders.length,
    pending: orders.filter((order) => order.status === "pending").length,
    delivered: orders.filter((order) => order.status === "delivered").length,
    recent: queryOrders(orders, {
      search: "",
      status: "",
      sort: "newest",
    }).slice(0, 3),
  }),
);
