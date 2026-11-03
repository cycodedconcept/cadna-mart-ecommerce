import test from "node:test";
import assert from "node:assert/strict";
import { createServer } from "vite";
import { configureStore } from "@reduxjs/toolkit";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const account = await server.ssrLoadModule("/src/features/account/slice.ts");
  const persistence = await server.ssrLoadModule(
    "/src/features/account/persistence.ts",
  );
  const auth = await server.ssrLoadModule("/src/features/auth/slice.ts");
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const { store } = await server.ssrLoadModule("/src/app/store.ts");
  const { validateReset } = await server.ssrLoadModule(
    "/src/features/auth/validation.ts",
  );
  const address = {
    id: "home",
    label: "Home",
    address: "12 Demo Road",
    city: "Lagos",
    state: "Lagos",
  };
  const profile = {
    fullName: "Demo Customer",
    email: "demo@example.com",
    phone: "08012345678",
  };
  const reducer = account.accountSlice.reducer;
  await test("address CRUD keeps exactly one default and promotes first remaining address", () => {
    let state = reducer(undefined, account.saveAddress(address));
    assert.equal(state.defaultId, "home");
    state = reducer(
      state,
      account.saveAddress({ ...address, id: "work", label: "Work" }),
    );
    state = reducer(state, account.setDefaultAddress("work"));
    assert.equal(state.defaultId, "work");
    state = reducer(
      state,
      account.saveAddress({ ...address, id: "work", city: "Abuja" }),
    );
    assert.equal(state.addresses.length, 2);
    assert.equal(state.addresses[1].city, "Abuja");
    assert.equal(
      reducer(state, account.setDefaultAddress("missing")).defaultId,
      "work",
    );
    state = reducer(state, account.deleteAddress("work"));
    assert.equal(state.defaultId, "home");
    state = reducer(state, account.deleteAddress("home"));
    assert.equal(state.defaultId, null);
    assert.deepEqual(reducer(state, auth.logout()), account.emptyAccount());
  });
  await test("invalid and oversized addresses cannot enter Redux", () => {
    const state = account.emptyAccount();
    for (const patch of [
      { label: "" },
      { address: "" },
      { city: "" },
      { state: "" },
      { address: "x".repeat(301) },
    ]) {
      assert.ok(
        Object.keys(account.validateAddress({ ...address, ...patch })).length,
      );
      assert.deepEqual(
        reducer(state, account.saveAddress({ ...address, ...patch })),
        state,
      );
    }
  });
  await test("persistence restores profile, addresses and preferences with customer isolation and no secrets", () => {
    const entries = new Map();
    const storage = {
      getItem: (key) => entries.get(key),
      setItem: (key, value) => entries.set(key, value),
    };
    let state = reducer(undefined, account.saveAddress(address));
    state = reducer(
      state,
      account.savePreferences({ promotions: true, orderUpdates: false }),
    );
    assert.equal(
      persistence.persistAccount(
        "a",
        state,
        { ...profile, password: "SECRET" },
        storage,
      ),
      true,
    );
    assert.deepEqual(persistence.restoreAccount("a", storage), {
      account: state,
      profile,
    });
    assert.deepEqual(persistence.restoreAccount("b", storage), {
      account: account.emptyAccount(),
    });
    assert.ok(![...entries.values()].join().includes("SECRET"));
    assert.equal(
      persistence.persistAccount("a", state, profile, {
        setItem() {
          throw Error();
        },
      }),
      false,
    );
    assert.deepEqual(
      persistence.restoreAccount("a", { getItem: () => "bad JSON" }),
      { account: account.emptyAccount() },
    );
  });
  await test("corrupt stored fields are ignored and invalid defaults repaired", () => {
    const storage = {
      getItem: () =>
        JSON.stringify({
          version: 1,
          addresses: [address, { id: "bad" }],
          defaultId: "missing",
          profile: { fullName: 7 },
          preferences: { promotions: "yes" },
        }),
    };
    const restored = persistence.restoreAccount("a", storage);
    assert.deepEqual(restored.account.addresses, [address]);
    assert.equal(restored.account.defaultId, "home");
    assert.equal(restored.profile, undefined);
    assert.equal(restored.account.preferences.promotions, false);
  });
  const render = (path) => {
    globalThis.location = new URL(path, "http://localhost");
    return renderToStaticMarkup(
      createElement(Provider, { store }, createElement(App)),
    );
  };
  await test("new routes are protected and settings clearly disables password changes", () => {
    assert.match(render("/account/addresses"), /Redirecting to demo login/);
    store.dispatch(
      auth.authSlice.actions.started({ operation: "login", requestId: "test" }),
    );
    store.dispatch(
      auth.authSlice.actions.succeeded({
        requestId: "test",
        customerId: "demo-test",
        profile,
      }),
    );
    assert.match(render("/account/addresses"), /No saved addresses/);
    store.dispatch(account.saveAddress(address));
    assert.match(render("/account/addresses"), /Default address/);
    const html = render("/account/settings");
    assert.match(html, /Password changes are unavailable/);
    assert.match(html, /disabled=""[^>]*>Change password/);
    assert.match(html, /Show new password/);
    assert.match(html, /type="checkbox"/);
  });
  await test("checkout prefills profile and default address without changing guest checkout", async () => {
    const { addItem } = await server.ssrLoadModule(
      "/src/features/cart/slice.ts",
    );
    store.dispatch(addItem({ productId: 0, quantity: 1 }));
    let html = render("/checkout");
    assert.match(html, /value="12 Demo Road"/);
    assert.match(html, /value="demo@example.com"/);
    assert.match(html, /Saved delivery address/);
    store.dispatch(auth.logout());
    html = render("/checkout");
    assert.ok(!html.includes("12 Demo Road"));
    assert.ok(!html.includes("Saved delivery address"));
  });
  await test("password validation rejects mismatch and weak passwords", () => {
    assert.ok(
      validateReset({ password: "weak", confirmPassword: "other" }).password,
    );
    assert.ok(
      validateReset({ password: "Secure!729", confirmPassword: "other" })
        .confirmPassword,
    );
    assert.deepEqual(
      validateReset({ password: "Secure!729", confirmPassword: "Secure!729" }),
      {},
    );
  });
  await test("preferences reset on logout in an independent store", () => {
    const isolated = configureStore({ reducer: { account: reducer } });
    isolated.dispatch(
      account.savePreferences({ promotions: true, orderUpdates: false }),
    );
    isolated.dispatch(auth.logout());
    assert.deepEqual(isolated.getState().account, account.emptyAccount());
  });
  await test("application store restores mock data on later login and preserves the original identity after email edits", () => {
    const entries = new Map();
    globalThis.window = {
      localStorage: {
        getItem: (key) => entries.get(key),
        setItem: (key, value) => entries.set(key, value),
      },
    };
    const signIn = () => {
      store.dispatch(
        auth.authSlice.actions.started({
          operation: "login",
          requestId: "persist",
        }),
      );
      store.dispatch(
        auth.authSlice.actions.succeeded({
          requestId: "persist",
          customerId: "demo-persistence",
          profile,
        }),
      );
    };
    try {
      signIn();
      store.dispatch(account.saveAddress(address));
      store.dispatch(
        account.savePreferences({ promotions: true, orderUpdates: false }),
      );
      store.dispatch(
        auth.authSlice.actions.restoreProfile({
          ...profile,
          email: "edited@example.com",
        }),
      );
      assert.equal(store.getState().auth.customerId, "demo-persistence");
      store.dispatch(auth.logout());
      assert.equal(store.getState().auth.profile, null);
      assert.equal(store.getState().account.addresses.length, 0);
      signIn();
      assert.equal(store.getState().auth.profile.email, "edited@example.com");
      assert.deepEqual(store.getState().account.addresses, [address]);
      assert.equal(store.getState().account.preferences.promotions, true);
      store.dispatch(auth.logout());
    } finally {
      delete globalThis.window;
    }
  });
} finally {
  await server.close();
  delete globalThis.location;
}
