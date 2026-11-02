import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { configureStore, combineSlices } from "@reduxjs/toolkit";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const cart = await server.ssrLoadModule("/src/features/cart/slice.ts");
  const persistence = await server.ssrLoadModule(
    "/src/features/cart/persistence.ts",
  );
  const checkout = await server.ssrLoadModule(
    "/src/features/checkout/slice.ts",
  );
  const { products } = await server.ssrLoadModule(
    "/src/features/catalogue/data.ts",
  );
  const { catalogueSlice } = await server.ssrLoadModule(
    "/src/features/catalogue/slice.ts",
  );
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const product = products[0];
  const key = { productId: product.id, variantId: "default" };
  const customer = {
    fullName: "Ada Test",
    email: "ada@example.com",
    phone: "+234 801 234 5678",
    address: "12 Market Road",
    city: "Lagos",
    state: "Lagos",
    instructions: "",
  };
  const makeStore = (submit = async () => {}, cartState) =>
    configureStore({
      reducer: combineSlices(
        catalogueSlice,
        cart.cartSlice,
        checkout.checkoutSlice,
      ),
      preloadedState: cartState ? { cart: cartState } : undefined,
      middleware: (get) =>
        get({
          thunk: {
            extraArgument: {
              orders: {
                save: async (order) => order,
                list: async () => ({ orders: [] }),
              },
              submit,
              reference: () => "DEMO-test-unique",
            },
          },
        }),
    });
  const add = (store) =>
    store.dispatch(cart.addItem({ productId: product.id }));
  const render = (store, path) => {
    globalThis.location = new URL(path, "http://localhost");
    return renderToStaticMarkup(
      createElement(Provider, { store }, createElement(App)),
    );
  };
  await test("add product, merge existing item and increase/decrease quantities", () => {
    const store = makeStore();
    add(store);
    add(store);
    assert.equal(store.getState().cart.items.length, 1);
    assert.equal(cart.selectCartQuantity(store.getState()), 2);
    store.dispatch(cart.setQuantity({ ...key, quantity: 3 }));
    assert.equal(cart.selectCartQuantity(store.getState()), 3);
    store.dispatch(cart.setQuantity({ ...key, quantity: 1 }));
    assert.equal(cart.selectCartQuantity(store.getState()), 1);
  });
  await test("remove item and clear cart leave an empty state", () => {
    const store = makeStore();
    add(store);
    store.dispatch(cart.removeItem(cart.itemKey(key)));
    assert.deepEqual(store.getState().cart.items, []);
    add(store);
    store.dispatch(cart.clearCart());
    assert.equal(cart.selectCartTotal(store.getState()), 0);
    assert.equal(cart.selectCartQuantity(store.getState()), 0);
  });
  await test("invalid quantities, missing products, unsupported variants and stock limits", () => {
    const store = makeStore();
    for (const quantity of [0, -1, 1.5, NaN, Infinity])
      store.dispatch(cart.addItem({ productId: product.id, quantity }));
    store.dispatch(cart.addItem({ productId: -1 }));
    store.dispatch(
      cart.addItem({ productId: product.id, variantId: "unknown" }),
    );
    store.dispatch(
      cart.addItem({ productId: products.find((p) => !p.stock).id }),
    );
    assert.equal(store.getState().cart.items.length, 0);
    add(store);
    for (const quantity of [0, -3, 1.5, NaN, Infinity])
      store.dispatch(cart.setQuantity({ ...key, quantity }));
    assert.equal(cart.selectCartQuantity(store.getState()), 1);
    store.dispatch(cart.addItem({ productId: product.id, quantity: 999 }));
    assert.equal(cart.selectCartQuantity(store.getState()), product.stock);
    store.dispatch(cart.setQuantity({ ...key, quantity: 999 }));
    assert.equal(cart.selectCartQuantity(store.getState()), product.stock);
  });
  await test("line totals, subtotal and final total use integer minor units", () => {
    assert.equal(cart.toMinor(0.1) * 3, 30);
    assert.equal(cart.toMinor(12.34), 1234);
    const store = makeStore();
    add(store);
    add(store);
    store.dispatch(cart.addItem({ productId: products[1].id, quantity: 3 }));
    assert.equal(
      cart.lineTotal(store.getState().cart.items[0]),
      product.price * 100 * 2,
    );
    assert.equal(
      cart.selectCartTotal(store.getState()),
      (product.price * 2 + products[1].price * 3) * 100,
    );
  });
  await test("cart persists and restores into a fresh store after refresh", () => {
    let saved;
    const storage = {
      getItem: () => saved,
      setItem: (_, value) => {
        saved = value;
      },
    };
    const store = makeStore();
    add(store);
    assert.equal(persistence.persistCart(store.getState().cart, storage), true);
    const refreshed = makeStore(undefined, persistence.restoreCart(storage));
    assert.deepEqual(refreshed.getState().cart, store.getState().cart);
    assert.ok(!saved.includes("price"));
  });
  await test("application store automatically persists changes and successful checkout clears saved cart", async () => {
    const { store } = await server.ssrLoadModule("/src/app/store.ts");
    const saved = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (key) => saved.get(key) ?? null,
        setItem: (key, value) => {
          saved.set(key, value);
        },
      },
    };
    try {
      add(store);
      assert.equal(
        persistence.restoreCart(window.localStorage).items[0].quantity,
        1,
      );
      const result = await store.dispatch(checkout.submitCheckout(customer));
      assert.equal(result.meta.requestStatus, "fulfilled");
      assert.deepEqual(JSON.parse(saved.get(persistence.CART_KEY)), []);
      assert.notEqual(
        checkout.demoServices.reference(),
        checkout.demoServices.reference(),
      );
    } finally {
      delete globalThis.window;
    }
  });
  await test("corrupt and blocked storage recover safely; restored items use current stock", () => {
    assert.deepEqual(persistence.restoreCart({ getItem: () => "{" }), {
      items: [],
    });
    assert.deepEqual(
      persistence.restoreCart({
        getItem: () => {
          throw Error("blocked");
        },
      }),
      { items: [] },
    );
    assert.equal(
      persistence.persistCart(
        { items: [] },
        {
          setItem: () => {
            throw Error("quota");
          },
        },
      ),
      false,
    );
    assert.equal(persistence.persistCart({ items: [] }), false);
    const restored = persistence.restoreCart({
      getItem: () =>
        JSON.stringify([
          { ...key, quantity: 999 },
          { ...key, quantity: 2 },
          { ...key, quantity: -1 },
          { ...key, quantity: 1.2 },
          { ...key, productId: -1, quantity: 1 },
          { ...key, variantId: "fake", quantity: 1 },
          null,
        ]),
    });
    assert.deepEqual(restored.items, [{ ...key, quantity: product.stock }]);
  });
  await test("required customer and delivery fields, email and phone validation", () => {
    assert.deepEqual(checkout.validateCheckout(customer), {});
    const errors = checkout.validateCheckout(
      Object.fromEntries(Object.keys(customer).map((key) => [key, " "])),
    );
    assert.equal(Object.keys(errors).length, 6);
    assert.ok(
      checkout.validateCheckout({ ...customer, email: "invalid" }).email,
    );
    for (const phone of ["abc1234567", "123", "+1234567890123456"])
      assert.ok(checkout.validateCheckout({ ...customer, phone }).phone);
    assert.equal(
      checkout.validateCheckout({ ...customer, phone: "08012345678" }).phone,
      undefined,
    );
  });
  await test("invalid form and empty cart cannot submit or clear existing items", async () => {
    let calls = 0;
    const store = makeStore(async () => {
      calls++;
    });
    add(store);
    const result = await store.dispatch(
      checkout.submitCheckout({ ...customer, email: "" }),
    );
    assert.equal(result.meta.requestStatus, "rejected");
    assert.equal(cart.selectCartQuantity(store.getState()), 1);
    store.dispatch(cart.clearCart());
    assert.equal(
      (await store.dispatch(checkout.submitCheckout(customer))).meta
        .requestStatus,
      "rejected",
    );
    assert.equal(calls, 0);
  });
  await test("duplicate checkout blocked; progress shown; success snapshots order then clears cart", async () => {
    let finish;
    let calls = 0;
    const store = makeStore(() => {
      calls++;
      return new Promise((resolve) => {
        finish = resolve;
      });
    });
    add(store);
    const first = store.dispatch(checkout.submitCheckout(customer));
    assert.equal(store.getState().checkout.status, "submitting");
    assert.equal(cart.selectCartQuantity(store.getState()), 1);
    assert.match(render(store, "/checkout"), /Submitting demo order/);
    const second = await store.dispatch(checkout.submitCheckout(customer));
    assert.equal(second.meta.condition, true);
    assert.equal(calls, 1);
    finish();
    await first;
    assert.equal(store.getState().checkout.status, "success");
    assert.equal(cart.selectCartQuantity(store.getState()), 0);
    const order = store.getState().checkout.order;
    assert.equal(order.reference, "DEMO-test-unique");
    assert.equal(order.customer.fullName, customer.fullName);
    assert.equal(order.items[0].quantity, 1);
    assert.equal(order.total, product.price * 100);
    assert.match(render(store, "/order-confirmation"), /DEMO-test-unique/);
    assert.match(
      render(store, "/order-confirmation"),
      /No payment has been taken/,
    );
  });
  await test("failed checkout preserves cart and persisted data; retry succeeds", async () => {
    let fail = true;
    const store = makeStore(async () => {
      if (fail) throw Error("Simulated service failure");
    });
    add(store);
    const before = store.getState().cart;
    const result = await store.dispatch(checkout.submitCheckout(customer));
    assert.equal(result.meta.requestStatus, "rejected");
    assert.deepEqual(store.getState().cart, before);
    assert.match(render(store, "/checkout"), /Your cart has been preserved/);
    let saved;
    persistence.persistCart(store.getState().cart, {
      setItem: (_, value) => {
        saved = value;
      },
    });
    assert.deepEqual(persistence.restoreCart({ getItem: () => saved }), before);
    fail = false;
    await store.dispatch(checkout.submitCheckout(customer));
    assert.equal(store.getState().checkout.status, "success");
    assert.deepEqual(store.getState().cart.items, []);
  });
  await test("empty cart, checkout guard, confirmation fallback and populated cart markup", () => {
    const store = makeStore();
    assert.match(render(store, "/cart"), /Your cart is empty/);
    assert.match(
      render(store, "/checkout"),
      /Add products before checking out/,
    );
    assert.match(
      render(store, "/order-confirmation"),
      /No demo confirmation available/,
    );
    add(store);
    const html = render(store, "/cart");
    for (const text of [
      "Cart (1)",
      "Unit price",
      "Order summary",
      "Proceed to demo checkout",
      "Continue shopping",
      "Clear cart",
      "Remove",
      "Increase quantity",
      "Decrease quantity",
    ])
      assert.ok(html.includes(text), text);
    const form = render(store, "/checkout");
    for (const field of [
      "fullName",
      "email",
      "phone",
      "address",
      "city",
      "state",
    ])
      assert.ok(form.includes(`id="${field}"`));
    assert.match(form, /No live order is placed/);
  });
} finally {
  await server.close();
  delete globalThis.location;
}
