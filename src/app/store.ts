import { combineSlices, configureStore } from "@reduxjs/toolkit";
import { catalogueSlice } from "../features/catalogue/slice";
import { cartSlice } from "../features/cart/slice";
import {
  browserStorage,
  persistCart,
  restoreCart,
} from "../features/cart/persistence";
import { checkoutSlice, demoServices } from "../features/checkout/slice";
import { authSlice } from "../features/auth/slice";
import { mockAuthAdapter } from "../features/auth/adapter";
import { ordersSlice } from "../features/orders/slice";

// Add feature slices here as they are implemented.
const rootReducer = combineSlices(
  catalogueSlice,
  cartSlice,
  checkoutSlice,
  authSlice,
  ordersSlice,
);

export const store = configureStore({
  reducer: rootReducer,
  preloadedState: { cart: restoreCart(browserStorage()) },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: { extraArgument: { ...demoServices, auth: mockAuthAdapter } },
    }),
});

let storageFailed = false;
const persistenceListeners = new Set<() => void>();
export const subscribeCartPersistence = (listener: () => void) => {
  persistenceListeners.add(listener);
  return () => {
    persistenceListeners.delete(listener);
  };
};
export const getCartPersistenceSnapshot = () => storageFailed;
export const getServerPersistenceSnapshot = () => false;
function saveCart() {
  const failed = !persistCart(store.getState().cart, browserStorage());
  if (failed !== storageFailed) {
    storageFailed = failed;
    persistenceListeners.forEach((listener) => listener());
  }
}
let previousCart = store.getState().cart;
store.subscribe(() => {
  const cart = store.getState().cart;
  if (cart !== previousCart) {
    previousCart = cart;
    saveCart();
  }
});
if (typeof window !== "undefined") saveCart();

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
