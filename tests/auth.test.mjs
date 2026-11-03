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
  const auth = await server.ssrLoadModule("/src/features/auth/slice.ts");
  const validation = await server.ssrLoadModule(
    "/src/features/auth/validation.ts",
  );
  const navigation = await server.ssrLoadModule(
    "/src/features/auth/navigation.ts",
  );
  const { mockAuthAdapter } = await server.ssrLoadModule(
    "/src/features/auth/adapter.ts",
  );
  const { PasswordField } = await server.ssrLoadModule(
    "/src/components/auth/AuthField.tsx",
  );
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const cart = await server.ssrLoadModule("/src/features/cart/slice.ts");
  const persistence = await server.ssrLoadModule(
    "/src/features/cart/persistence.ts",
  );
  const checkout = await server.ssrLoadModule(
    "/src/features/checkout/slice.ts",
  );
  const { catalogueSlice } = await server.ssrLoadModule(
    "/src/features/catalogue/slice.ts",
  );
  const profile = {
    fullName: "Ada Customer",
    email: "ada@example.com",
    phone: "08012345678",
  };
  const credentials = {
    ...profile,
    password: "Secure!729",
    confirmPassword: "Secure!729",
  };
  function makeStore(overrides = {}) {
    const actions = [];
    const adapter = {
      login: async () => profile,
      register: async () => {},
      forgotPassword: async () => {},
      resetPassword: async () => {},
      updateProfile: async (value) => value,
      ...overrides,
    };
    const capture = () => (next) => (action) => {
      actions.push(action);
      return next(action);
    };
    const store = configureStore({
      reducer: combineSlices(
        catalogueSlice,
        cart.cartSlice,
        checkout.checkoutSlice,
        auth.authSlice,
      ),
      middleware: (get) =>
        get({
          thunk: {
            extraArgument: {
              orders: {
                save: async (order) => order,
                list: async () => ({ orders: [] }),
              },
              auth: adapter,
              submit: async () => {},
              reference: () => "DEMO-auth-regression",
            },
          },
        }).concat(capture),
    });
    return { store, actions };
  }
  const render = (store, path) => {
    globalThis.location = new URL(path, "http://localhost");
    return renderToStaticMarkup(
      createElement(Provider, { store }, createElement(App)),
    );
  };
  await test("registration form renders all fields, labels, visibility controls and demo notice", () => {
    const { store } = makeStore();
    const html = render(store, "/register");
    for (const field of [
      "fullName",
      "email",
      "phone",
      "password",
      "confirmPassword",
    ]) {
      assert.match(html, new RegExp(`id="auth-${field}"`));
      assert.match(html, new RegExp(`for="auth-${field}"`));
    }
    for (const text of [
      "Frontend demo only",
      "Show password",
      "Show confirm password",
      "Password requirements",
      "Create demo account",
      "Sign in",
    ])
      assert.ok(html.includes(text), text);
    assert.ok(!html.includes("Continue with Google"));
  });
  await test("registration required fields, email, phone, password rules and matching passwords", () => {
    assert.deepEqual(validation.validateRegistration(credentials), {});
    assert.equal(
      Object.keys(
        validation.validateRegistration({
          fullName: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: "",
        }),
      ).length,
      5,
    );
    assert.ok(
      validation.validateRegistration({ ...credentials, email: "wrong" }).email,
    );
    assert.ok(
      validation.validateRegistration({ ...credentials, phone: "abc1234567" })
        .phone,
    );
    assert.ok(
      validation.validateRegistration({
        ...credentials,
        confirmPassword: "Different!72",
      }).confirmPassword,
    );
    for (const password of [
      "short",
      "NoDigits!",
      "NoSymbol123",
      "Space !123",
      "ada!12345",
      "Customer!73",
    ])
      assert.ok(
        validation.validateRegistration({
          ...credentials,
          password,
          confirmPassword: password,
        }).password,
        password,
      );
    assert.ok(
      validation.validateRegistration({
        ...credentials,
        fullName: "x".repeat(101),
      }).fullName,
    );
  });
  await test("password visibility control changes field type and accessible state in both directions", () => {
    let visible = false;
    const props = () => ({
      label: "Password",
      name: "password",
      value: "example",
      onChange: () => {},
      visible,
      onToggle: () => {
        visible = !visible;
      },
    });
    let control = PasswordField(props());
    assert.match(renderToStaticMarkup(control), /type="password"/);
    assert.match(renderToStaticMarkup(control), /aria-pressed="false"/);
    control.props.children[1].props.onClick();
    control = PasswordField(props());
    assert.match(renderToStaticMarkup(control), /type="text"/);
    assert.match(renderToStaticMarkup(control), /aria-label="Hide password"/);
    control.props.children[1].props.onClick();
    assert.match(
      renderToStaticMarkup(PasswordField(props())),
      /type="password"/,
    );
  });
  await test("registration succeeds without authenticating or retaining credentials in actions/state", async () => {
    const { store, actions } = makeStore();
    assert.equal(
      await store.dispatch(auth.registerDemo(credentials)),
      "success",
    );
    assert.equal(store.getState().auth.status, "success");
    assert.equal(auth.selectIsAuthenticated(store.getState()), false);
    const serialized = JSON.stringify({ state: store.getState(), actions });
    for (const secret of [
      credentials.password,
      "confirmPassword",
      "password",
      "token",
    ])
      assert.ok(!serialized.includes(secret), secret);
  });
  await test("invalid auth input is rejected before invoking adapter", async () => {
    let calls = 0;
    const { store } = makeStore({
      login: async () => {
        calls++;
        return profile;
      },
      register: async () => {
        calls++;
      },
    });
    assert.equal(
      await store.dispatch(auth.loginDemo({ email: "invalid", password: "" })),
      "error",
    );
    assert.equal(
      await store.dispatch(
        auth.registerDemo({ ...credentials, confirmPassword: "" }),
      ),
      "error",
    );
    assert.equal(calls, 0);
    assert.equal(auth.selectCustomer(store.getState()), null);
  });
  await test("login validates fields and changes Redux demo authentication state", async () => {
    assert.deepEqual(
      validation.validateLogin({ email: profile.email, password: "anything" }),
      {},
    );
    assert.ok(validation.validateLogin({ email: "", password: "" }).email);
    assert.ok(
      validation.validateLogin({ email: profile.email, password: " " })
        .password,
    );
    const { store, actions } = makeStore();
    assert.equal(await store.dispatch(auth.loginDemo(credentials)), "success");
    assert.deepEqual(auth.selectCustomer(store.getState()), profile);
    assert.equal(auth.selectIsAuthenticated(store.getState()), true);
    assert.ok(!JSON.stringify(actions).includes(credentials.password));
  });
  await test("failed mock login displays safe error and permits a retry", async () => {
    let fail = true;
    const { store, actions } = makeStore({
      login: async () => {
        if (fail) throw Error(`Failed ${credentials.password}`);
        return profile;
      },
    });
    assert.equal(await store.dispatch(auth.loginDemo(credentials)), "error");
    assert.equal(store.getState().auth.status, "error");
    assert.match(store.getState().auth.error, /try again/);
    assert.equal(auth.selectIsAuthenticated(store.getState()), false);
    assert.ok(
      !JSON.stringify({ actions, state: store.getState() }).includes(
        credentials.password,
      ),
    );
    fail = false;
    assert.equal(await store.dispatch(auth.loginDemo(credentials)), "success");
  });
  await test("loading and duplicate submission guard apply to login and registration", async () => {
    for (const operation of ["login", "register"]) {
      let finish;
      let calls = 0;
      const { store } = makeStore({
        [operation]: () => {
          calls++;
          return new Promise((resolve) => {
            finish = () => resolve(operation === "login" ? profile : undefined);
          });
        },
      });
      const action = operation === "login" ? auth.loginDemo : auth.registerDemo;
      const first = store.dispatch(action(credentials));
      assert.equal(store.getState().auth.status, "loading");
      assert.equal(await store.dispatch(action(credentials)), "busy");
      assert.match(render(store, `/${operation}`), /aria-busy="true"/);
      assert.equal(calls, 1);
      finish();
      assert.equal(await first, "success");
    }
  });
  await test("forgot-password request and reset validation/success use mock adapter without tokens", async () => {
    let forgot = 0;
    let reset = 0;
    const { store, actions } = makeStore({
      forgotPassword: async (email) => {
        assert.equal(email, profile.email);
        forgot++;
      },
      resetPassword: async () => {
        reset++;
      },
    });
    assert.equal(await store.dispatch(auth.forgotPasswordDemo("bad")), "error");
    assert.equal(
      await store.dispatch(auth.forgotPasswordDemo(profile.email)),
      "success",
    );
    assert.equal(forgot, 1);
    assert.ok(
      validation.validateReset({ password: "weak", confirmPassword: "other" })
        .password,
    );
    assert.ok(
      validation.validateReset({
        password: credentials.password,
        confirmPassword: "",
      }).confirmPassword,
    );
    assert.equal(
      await store.dispatch(auth.resetPasswordDemo(credentials)),
      "success",
    );
    assert.equal(reset, 1);
    assert.equal(auth.selectCustomer(store.getState()), null);
    assert.ok(!JSON.stringify(actions).includes(credentials.password));
    for (const path of [
      "/forgot-password",
      "/reset-password",
      "/password-reset-success",
    ])
      assert.match(render(store, path), /Frontend demo only/);
    assert.match(
      render(store, "/password-reset-success"),
      /No real password has been changed/,
    );
  });
  await test("protected routes expose login destination without rendering private account data", () => {
    const { store } = makeStore();
    for (const path of ["/account", "/account/profile"]) {
      assert.equal(navigation.isProtectedPath(path), true);
      const html = render(store, path);
      assert.ok(html.includes(navigation.loginDestination(path)));
      assert.match(html, /Redirecting to demo login/);
      assert.ok(!html.includes("Customer profile"));
    }
  });
  await test("intended protected destination is restored after login and unsafe return URLs are rejected", async () => {
    const requested = "/account/profile";
    const query = new URL(
      navigation.loginDestination(requested),
      "http://localhost",
    ).searchParams;
    assert.equal(navigation.safeReturnTo(query.get("returnTo")), requested);
    for (const value of [
      null,
      "https://evil.test",
      "//evil.test",
      "/checkout",
      "/login",
      "/account/../login",
      "/account?evil=1",
    ])
      assert.equal(navigation.safeReturnTo(value), "/account");
    const { store } = makeStore();
    assert.equal(await store.dispatch(auth.loginDemo(credentials)), "success");
    assert.match(
      render(store, navigation.safeReturnTo(query.get("returnTo"))),
      /Save changes/,
    );
    assert.match(
      render(store, "/login?returnTo=%2Faccount%2Fprofile"),
      /href="\/forgot-password\?returnTo=%2Faccount%2Fprofile"/,
    );
    assert.match(
      render(store, "/forgot-password?returnTo=%2Faccount%2Fprofile"),
      /href="\/login\?returnTo=%2Faccount%2Fprofile"/,
    );
    assert.match(
      render(store, "/password-reset-success?returnTo=%2Faccount%2Fprofile"),
      /href="\/login\?returnTo=%2Faccount%2Fprofile"/,
    );
  });
  await test("History API navigation supports replace and signals route updates", () => {
    const events = [];
    const changes = [];
    globalThis.history = {
      pushState: (_, __, path) => changes.push(["push", path]),
      replaceState: (_, __, path) => changes.push(["replace", path]),
    };
    globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
    globalThis.PopStateEvent = class {
      constructor(type) {
        this.type = type;
      }
    };
    try {
      navigation.navigate("/account/profile");
      navigation.navigate("/login", true);
      assert.deepEqual(changes, [
        ["push", "/account/profile"],
        ["replace", "/login"],
      ]);
      assert.deepEqual(events, ["popstate", "popstate"]);
    } finally {
      delete globalThis.history;
      delete globalThis.window;
      delete globalThis.PopStateEvent;
    }
  });
  await test("authenticated account overview, navigation, profile form and header render", async () => {
    const { store } = makeStore();
    await store.dispatch(auth.loginDemo(credentials));
    const html = render(store, "/account");
    for (const text of [
      profile.fullName,
      profile.email,
      profile.phone,
      "Account overview",
      "Edit profile",
      "Log out",
      "My account",
    ])
      assert.ok(html.includes(text), text);
    const form = render(store, "/account/profile");
    assert.match(form, /Save changes/);
    assert.match(form, /Cancel/);
    assert.match(form, /value="Ada Customer"/);
  });
  await test("profile editing validates and updates allowed fields; failures preserve previous profile", async () => {
    let fail = false;
    const { store } = makeStore({
      updateProfile: async (value) => {
        if (fail) throw Error("save failed");
        return value;
      },
    });
    await store.dispatch(auth.loginDemo(credentials));
    assert.equal(
      await store.dispatch(
        auth.updateDemoProfile({ ...profile, fullName: "" }),
      ),
      "error",
    );
    assert.deepEqual(auth.selectCustomer(store.getState()), profile);
    const changed = {
      ...profile,
      fullName: " New Name ",
      email: " NEW@example.com ",
    };
    assert.equal(
      await store.dispatch(auth.updateDemoProfile(changed)),
      "success",
    );
    assert.deepEqual(auth.selectCustomer(store.getState()), {
      ...profile,
      fullName: "New Name",
      email: "new@example.com",
    });
    const before = auth.selectCustomer(store.getState());
    fail = true;
    assert.equal(
      await store.dispatch(auth.updateDemoProfile(profile)),
      "error",
    );
    assert.deepEqual(auth.selectCustomer(store.getState()), before);
  });
  await test("profile update requires authentication and sanitizes adapter profile results", async () => {
    const { store, actions } = makeStore({
      login: async () => ({
        ...profile,
        password: credentials.password,
        token: "secret",
      }),
    });
    assert.equal(
      await store.dispatch(auth.updateDemoProfile(profile)),
      "error",
    );
    await store.dispatch(auth.loginDemo(credentials));
    assert.deepEqual(auth.selectCustomer(store.getState()), profile);
    assert.ok(!JSON.stringify(store.getState()).includes(credentials.password));
    // The adapter contract must return only public profile fields; sanitize before dispatch too.
    assert.ok(!JSON.stringify(actions).includes(credentials.password));
  });
  await test("logout cancels a pending login so late results cannot restore a session", async () => {
    let finish;
    const { store } = makeStore({
      login: () =>
        new Promise((resolve) => {
          finish = () => resolve(profile);
        }),
    });
    const pending = store.dispatch(auth.loginDemo(credentials));
    store.dispatch(auth.logout());
    finish();
    assert.equal(await pending, "cancelled");
    assert.equal(auth.selectCustomer(store.getState()), null);
    assert.equal(store.getState().auth.status, "idle");
  });
  await test("logout cancels pending profile saves and auth refresh always starts anonymous", async () => {
    let finish;
    const { store } = makeStore({
      updateProfile: () =>
        new Promise((resolve) => {
          finish = () => resolve(profile);
        }),
    });
    await store.dispatch(auth.loginDemo(credentials));
    const pending = store.dispatch(auth.updateDemoProfile(profile));
    store.dispatch(auth.logout());
    finish();
    assert.equal(await pending, "cancelled");
    assert.equal(auth.selectIsAuthenticated(store.getState()), false);
    assert.equal(
      auth.selectIsAuthenticated(makeStore().store.getState()),
      false,
    );
  });
  await test("cart and persisted storage survive login/logout; guest checkout still succeeds", async () => {
    const { store } = makeStore();
    store.dispatch(cart.addItem({ productId: 0, quantity: 2 }));
    const before = store.getState().cart;
    let saved;
    const storage = {
      getItem: () => saved,
      setItem: (_, value) => {
        saved = value;
      },
    };
    persistence.persistCart(before, storage);
    await store.dispatch(auth.loginDemo(credentials));
    store.dispatch(auth.logout());
    assert.deepEqual(store.getState().cart, before);
    assert.deepEqual(persistence.restoreCart(storage), before);
    assert.ok(!saved.includes(profile.email));
    const info = {
      ...profile,
      phone: profile.phone,
      address: "12 Market Road",
      city: "Lagos",
      state: "Lagos",
      instructions: "",
    };
    assert.equal(
      (await store.dispatch(checkout.submitCheckout(info))).meta.requestStatus,
      "fulfilled",
    );
    assert.equal(store.getState().cart.items.length, 0);
  });
  await test("default mock adapter has documented success/failure and retains no credential records", async () => {
    assert.equal(
      (await mockAuthAdapter.login(credentials)).email,
      profile.email,
    );
    await mockAuthAdapter.register(credentials);
    await mockAuthAdapter.forgotPassword("fail@example.com");
    await mockAuthAdapter.resetPassword(credentials);
    assert.deepEqual(await mockAuthAdapter.updateProfile(profile), profile);
    await assert.rejects(
      mockAuthAdapter.login({
        email: "fail@example.com",
        password: "anything",
      }),
    );
    await assert.rejects(
      mockAuthAdapter.register({ ...credentials, email: "fail@example.com" }),
    );
    await assert.rejects(
      mockAuthAdapter.updateProfile({ ...profile, email: "fail@example.com" }),
    );
  });
} finally {
  await server.close();
  delete globalThis.location;
}
