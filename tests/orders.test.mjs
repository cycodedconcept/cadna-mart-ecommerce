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
  const orders = await server.ssrLoadModule("/src/features/orders/slice.ts");
  const repo = await server.ssrLoadModule("/src/features/orders/repository.ts");
  const model = await server.ssrLoadModule("/src/features/orders/types.ts");
  const auth = await server.ssrLoadModule("/src/features/auth/slice.ts");
  const { demoCustomerId } = await server.ssrLoadModule(
    "/src/features/auth/identity.ts",
  );
  const navigation = await server.ssrLoadModule(
    "/src/features/auth/navigation.ts",
  );
  const cart = await server.ssrLoadModule("/src/features/cart/slice.ts");
  const checkout = await server.ssrLoadModule(
    "/src/features/checkout/slice.ts",
  );
  const { catalogueSlice } = await server.ssrLoadModule(
    "/src/features/catalogue/slice.ts",
  );
  const { products } = await server.ssrLoadModule(
    "/src/features/catalogue/data.ts",
  );
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const { default: StatusBadge } = await server.ssrLoadModule(
    "/src/components/orders/OrderStatusBadge.tsx",
  );
  const profile = {
    fullName: "Demo Shopper",
    email: "shopper@example.com",
    phone: "08012345678",
  };
  const customer = {
    ...profile,
    address: "Private sample address",
    city: "Lagos",
    state: "Lagos",
    instructions: "Private sample instructions",
  };
  const owner = await demoCustomerId(profile.email);
  const other = await demoCustomerId("other@example.com");
  function memoryStorage() {
    const values = new Map();
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      values,
    };
  }
  function makeStore({ repository, submit = async () => {}, reference } = {}) {
    const storage = memoryStorage();
    const repositoryInstance =
      repository ?? repo.createOrderRepository(() => storage);
    let index = 0;
    const store = configureStore({
      reducer: combineSlices(
        catalogueSlice,
        cart.cartSlice,
        checkout.checkoutSlice,
        auth.authSlice,
        orders.ordersSlice,
      ),
      middleware: (get) =>
        get({
          thunk: {
            extraArgument: {
              orders: repositoryInstance,
              submit,
              reference: reference ?? (() => `DEMO-order-${++index}`),
              auth: {
                login: async ({ email }) => ({ ...profile, email }),
                updateProfile: async (value) => value,
              },
            },
          },
        }),
    });
    return { store, storage, repository: repositoryInstance };
  }
  const login = (store, email = profile.email) =>
    store.dispatch(auth.loginDemo({ email, password: "demo" }));
  const add = (store) =>
    store.dispatch(cart.addItem({ productId: 0, quantity: 2 }));
  const render = (store, path) => {
    globalThis.location = new URL(path, "http://localhost");
    return renderToStaticMarkup(
      createElement(Provider, { store }, createElement(App)),
    );
  };
  const base = (
    id = "DEMO-seed",
    customerId = owner,
    total = 12345,
    date = "2026-10-30T12:00:00.000Z",
    status = "pending",
  ) => ({
    id,
    reference: id,
    customerId,
    createdAt: date,
    status,
    subtotal: total,
    total,
    delivery: model.fictionalDelivery,
    items: [
      {
        productId: 0,
        name: "Historical sample laptop",
        image: "/images/product-0.png",
        quantity: 1,
        unitPrice: total,
        total,
      },
    ],
  });
  const query = (overrides) => ({
    search: "",
    status: "",
    sort: "newest",
    ...overrides,
  });

  await test("successful signed-in checkout stores snapshot, associates owner, exposes history and clears cart", async () => {
    const { store, repository } = makeStore();
    await login(store);
    add(store);
    assert.equal(
      (await store.dispatch(checkout.submitCheckout(customer))).meta
        .requestStatus,
      "fulfilled",
    );
    assert.equal(store.getState().cart.items.length, 0);
    assert.equal(orders.selectCustomerOrders(store.getState()).length, 1);
    const stored = (await repository.list(owner)).orders[0];
    assert.equal(stored.customerId, owner);
    assert.equal(stored.status, "pending");
    assert.equal(stored.items[0].quantity, 2);
    assert.equal(stored.items[0].unitPrice, products[0].price * 100);
    assert.equal(stored.total, stored.items[0].total);
    assert.equal(stored.subtotal, stored.total);
    assert.equal(store.getState().checkout.order.reference, stored.reference);
    assert.equal(store.getState().checkout.order.historyOrderId, stored.id);
    assert.match(render(store, "/order-confirmation"), /View saved order/);
  });
  await test("default order references are unique and repeated pending submissions create one order", async () => {
    assert.notEqual(
      checkout.demoServices.reference(),
      checkout.demoServices.reference(),
    );
    let finish;
    let calls = 0;
    const { store, repository } = makeStore({
      submit: () => {
        calls++;
        return new Promise((resolve) => {
          finish = resolve;
        });
      },
    });
    await login(store);
    add(store);
    const first = store.dispatch(checkout.submitCheckout(customer));
    assert.equal(
      (await store.dispatch(checkout.submitCheckout(customer))).meta.condition,
      true,
    );
    assert.equal(calls, 1);
    finish();
    await first;
    assert.equal((await repository.list(owner)).orders.length, 1);
  });
  await test("repository saves are idempotent; conflicting references cannot replace historical orders", async () => {
    const { repository } = makeStore();
    const record = base();
    await repository.save(record);
    await repository.save(record);
    assert.equal((await repository.list(owner)).orders.length, 1);
    await assert.rejects(
      repository.save({ ...record, customerId: other }),
      /conflicting/,
    );
    assert.equal((await repository.list(other)).orders.length, 0);
  });
  await test("orders survive repository/store recreation and same-customer login after refresh", async () => {
    const { store, storage } = makeStore();
    await login(store);
    add(store);
    await store.dispatch(checkout.submitCheckout(customer));
    const refreshed = makeStore({
      repository: repo.createOrderRepository(() => storage),
    }).store;
    assert.equal(auth.selectCustomerId(refreshed.getState()), null);
    await login(refreshed);
    await refreshed.dispatch(orders.loadOrders());
    assert.equal(orders.selectCustomerOrders(refreshed.getState()).length, 1);
    assert.equal(JSON.parse(storage.getItem(repo.ORDERS_KEY)).version, 1);
  });
  await test("order storage omits contact/address/password data and normalizes delivery to fictional values", async () => {
    const { store, storage } = makeStore();
    await login(store);
    add(store);
    await store.dispatch(checkout.submitCheckout(customer));
    const saved = storage.getItem(repo.ORDERS_KEY);
    for (const value of [
      profile.email,
      profile.fullName,
      profile.phone,
      customer.address,
      customer.instructions,
      "password",
      "token",
    ])
      assert.ok(!saved.includes(value), value);
    const record = JSON.parse(saved).orders[0];
    assert.deepEqual(record.delivery, model.fictionalDelivery);
    const { repository } = makeStore();
    await repository.save({
      ...base(),
      extraSecret: "not saved",
      delivery: { address: "private", city: "private", state: "private" },
    });
    assert.deepEqual(
      (await repository.list(owner)).orders[0].delivery,
      model.fictionalDelivery,
    );
  });
  await test("guest orders remain separate after login and are not automatically claimed", async () => {
    const { store, storage } = makeStore();
    add(store);
    await store.dispatch(checkout.submitCheckout(customer));
    assert.equal(
      JSON.parse(storage.getItem(repo.ORDERS_KEY)).orders[0].customerId,
      null,
    );
    assert.ok(
      !render(store, "/order-confirmation").includes("View saved order"),
    );
    await login(store);
    await store.dispatch(orders.loadOrders());
    assert.deepEqual(orders.selectCustomerOrders(store.getState()), []);
  });
  await test("customer-specific retrieval and details never expose another customer order", async () => {
    const { store, repository } = makeStore();
    await repository.save(base("DEMO-mine"));
    await repository.save(base("DEMO-other", other));
    await login(store);
    await store.dispatch(orders.loadOrders());
    assert.deepEqual(
      orders.selectCustomerOrders(store.getState()).map((order) => order.id),
      ["DEMO-mine"],
    );
    assert.equal(
      orders.selectOrderById(store.getState(), "DEMO-other"),
      undefined,
    );
    const html = render(store, "/account/orders/DEMO-other");
    assert.match(html, /Order not found/);
    assert.ok(!html.includes("Historical sample laptop"));
    assert.match(render(store, "/account/orders/missing"), /Order not found/);
  });
  await test("search by reference/product name and status filters combine without mutating history", () => {
    const data = [
      base("DEMO-ONE"),
      {
        ...base("DEMO-TWO", owner, 20000, undefined, "delivered"),
        items: [
          {
            ...base().items[0],
            name: "Sample headphones",
            total: 20000,
            unitPrice: 20000,
          },
        ],
      },
    ];
    assert.equal(
      orders.queryOrders(data, query({ search: " demo-one " }))[0].id,
      "DEMO-ONE",
    );
    assert.equal(
      orders.queryOrders(data, query({ search: "HEADPHONES" }))[0].id,
      "DEMO-TWO",
    );
    assert.equal(
      orders.queryOrders(data, query({ status: "delivered" })).length,
      1,
    );
    assert.equal(
      orders.queryOrders(
        data,
        query({ status: "pending", search: "headphones" }),
      ).length,
      0,
    );
    assert.deepEqual(
      data.map((order) => order.id),
      ["DEMO-ONE", "DEMO-TWO"],
    );
  });
  await test("newest/oldest/total sorting and no-results are deterministic", () => {
    const data = [
      base("DEMO-old", owner, 20000, "2026-01-01T00:00:00Z"),
      base("DEMO-new", owner, 10000, "2026-02-01T00:00:00Z"),
    ];
    assert.equal(orders.queryOrders(data, query())[0].id, "DEMO-new");
    assert.equal(
      orders.queryOrders(data, query({ sort: "oldest" }))[0].id,
      "DEMO-old",
    );
    assert.equal(
      orders.queryOrders(data, query({ sort: "total-asc" }))[0].id,
      "DEMO-new",
    );
    assert.equal(
      orders.queryOrders(data, query({ sort: "total-desc" }))[0].id,
      "DEMO-old",
    );
    assert.deepEqual(
      orders.queryOrders(data, query({ search: "unfindable" })),
      [],
    );
  });
  await test("historical prices/names remain independent of current catalogue and validate integer totals", async () => {
    const { store, repository } = makeStore();
    const historical = base();
    await repository.save(historical);
    historical.items[0].unitPrice = 99999;
    await login(store);
    await store.dispatch(orders.loadOrders());
    const order = orders.selectCustomerOrders(store.getState())[0];
    assert.equal(order.items[0].unitPrice, 12345);
    assert.notEqual(order.items[0].unitPrice, products[0].price * 100);
    assert.equal(
      order.items[0].total,
      order.items[0].quantity * order.items[0].unitPrice,
    );
    const html = render(store, "/account/orders/DEMO-seed");
    assert.match(html, /Historical sample laptop/);
    assert.match(html, /123.45/);
    assert.match(html, /Fictional delivery information/);
    assert.match(html, /No payment was collected/);
    await assert.rejects(repository.save({ ...base("DEMO-bad"), total: 1 }));
  });
  await test("empty history and dashboard summaries/rendering use customer-scoped selectors", async () => {
    const { store, repository } = makeStore();
    await login(store);
    await store.dispatch(orders.loadOrders());
    assert.match(render(store, "/account/orders"), /No demo orders yet/);
    assert.equal(orders.selectOrderSummary(store.getState()).total, 0);
    await repository.save(base("DEMO-pending"));
    await repository.save(
      base("DEMO-delivered", owner, 20000, "2026-11-01T00:00:00Z", "delivered"),
    );
    await repository.save(base("DEMO-stranger", other));
    await store.dispatch(orders.loadOrders());
    const summary = orders.selectOrderSummary(store.getState());
    assert.equal(summary.total, 2);
    assert.equal(summary.pending, 1);
    assert.equal(summary.delivered, 1);
    assert.equal(summary.recent[0].id, "DEMO-delivered");
    const html = render(store, "/account");
    for (const text of [
      "Total orders",
      "Pending orders",
      "Delivered orders",
      "Recent orders",
      "View all orders",
    ])
      assert.ok(html.includes(text), text);
    assert.ok(!html.includes("DEMO-stranger"));
    const history = render(store, "/account/orders");
    for (const text of [
      "Search orders",
      "All statuses",
      "Newest first",
      "Oldest first",
      "Total: low to high",
      "View details",
    ])
      assert.ok(history.includes(text), text);
  });
  await test("all five display-only status badges are accessible and retain text labels", () => {
    for (const status of model.orderStatuses) {
      const html = renderToStaticMarkup(createElement(StatusBadge, { status }));
      assert.match(html, /aria-label="Demo order status:/);
      assert.ok(html.includes(`status-${status}`));
      assert.ok(!html.includes("<button"));
    }
  });
  await test("malformed storage recovers safely; invalid records/duplicates are discarded", async () => {
    const storage = memoryStorage();
    const repository = repo.createOrderRepository(() => storage);
    storage.setItem(repo.ORDERS_KEY, "{broken");
    const invalid = await repository.list(owner);
    assert.deepEqual(invalid.orders, []);
    assert.ok(invalid.warning);
    await repository.save(base());
    storage.setItem(
      repo.ORDERS_KEY,
      JSON.stringify({
        version: 1,
        orders: [
          base(),
          base(),
          null,
          {
            ...base("DEMO-invalid"),
            items: [{ ...base().items[0], quantity: -1 }],
          },
          {
            ...base("DEMO-remote"),
            items: [{ ...base().items[0], image: "https://remote.test/a" }],
          },
        ],
      }),
    );
    const restored = await repository.list(owner);
    assert.equal(restored.orders.length, 1);
    assert.ok(restored.warning);
    storage.setItem(
      repo.ORDERS_KEY,
      JSON.stringify({ version: 999, orders: [] }),
    );
    await assert.rejects(repository.list(owner), /Unsupported/);
    await assert.rejects(repository.save(base()), /Unsupported/);
  });
  await test("storage write failure rejects checkout and preserves cart; retry succeeds and clears it", async () => {
    let blocked = true;
    const storage = memoryStorage();
    const target = {
      getItem: storage.getItem,
      setItem: (key, value) => {
        if (blocked) throw Error("quota");
        storage.setItem(key, value);
      },
    };
    const { store } = makeStore({
      repository: repo.createOrderRepository(() => target),
    });
    await login(store);
    add(store);
    const before = store.getState().cart;
    assert.equal(
      (await store.dispatch(checkout.submitCheckout(customer))).meta
        .requestStatus,
      "rejected",
    );
    assert.deepEqual(store.getState().cart, before);
    assert.equal(orders.selectCustomerOrders(store.getState()).length, 0);
    assert.match(render(store, "/checkout"), /Your cart has been preserved/);
    blocked = false;
    assert.equal(
      (await store.dispatch(checkout.submitCheckout(customer))).meta
        .requestStatus,
      "fulfilled",
    );
    assert.equal(store.getState().cart.items.length, 0);
  });
  await test("order loading/error/retry and blocked storage display safe feedback", async () => {
    let fail = true;
    const { store } = makeStore({
      repository: {
        list: async () => {
          if (fail) throw Error("blocked");
          return { orders: [] };
        },
        save: async (value) => value,
      },
    });
    await login(store);
    assert.match(render(store, "/account/orders"), /Loading demo orders/);
    await store.dispatch(orders.loadOrders());
    assert.equal(store.getState().orders.status, "error");
    assert.match(render(store, "/account/orders"), /Try again/);
    fail = false;
    await store.dispatch(orders.loadOrders());
    assert.equal(store.getState().orders.status, "ready");
    assert.match(render(store, "/account/orders"), /No demo orders yet/);
    await assert.rejects(
      repo.createOrderRepository(() => undefined).list(owner),
      /unavailable/,
    );
  });
  await test("logout/account switching clears memory, protects details and ignores delayed history responses", async () => {
    let finish;
    const { store } = makeStore({
      repository: {
        list: () =>
          new Promise((resolve) => {
            finish = () => resolve({ orders: [base()] });
          }),
        save: async (value) => value,
      },
    });
    await login(store);
    const pending = store.dispatch(orders.loadOrders());
    store.dispatch(auth.logout());
    assert.equal(store.getState().orders.items.length, 0);
    await login(store, "other@example.com");
    finish();
    await pending;
    assert.equal(orders.selectCustomerOrders(store.getState()).length, 0);
    assert.equal(store.getState().orders.customerId, other);
    store.dispatch(auth.logout());
    assert.match(render(store, "/account/orders"), /Redirecting to demo login/);
    assert.match(
      render(store, "/account/orders/DEMO-seed"),
      /Redirecting to demo login/,
    );
    assert.equal(
      navigation.safeReturnTo("/account/orders/DEMO-seed"),
      "/account/orders/DEMO-seed",
    );
    assert.equal(
      navigation.safeReturnTo("/account/orders/../profile"),
      "/account",
    );
  });
  await test("profile edits retain owner identity and same normalized login restores it", async () => {
    const { store } = makeStore();
    await login(store);
    const id = auth.selectCustomerId(store.getState());
    await store.dispatch(
      auth.updateDemoProfile({ ...profile, email: "edited@example.com" }),
    );
    assert.equal(auth.selectCustomerId(store.getState()), id);
    assert.equal(await demoCustomerId(" SHOPPER@EXAMPLE.COM "), id);
  });
  await test("logout during checkout cannot expose old customer confirmation/history to a new customer", async () => {
    let finish;
    const { store, repository } = makeStore({
      submit: () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    });
    await login(store);
    add(store);
    const pending = store.dispatch(checkout.submitCheckout(customer));
    store.dispatch(auth.logout());
    await login(store, "other@example.com");
    finish();
    await pending;
    assert.equal((await repository.list(owner)).orders.length, 1);
    assert.equal(orders.selectCustomerOrders(store.getState()).length, 0);
    assert.match(
      render(store, "/order-confirmation"),
      /No demo confirmation available/,
    );
  });
} finally {
  await server.close();
  delete globalThis.location;
}
