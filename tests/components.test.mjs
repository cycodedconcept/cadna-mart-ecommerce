import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { createServer } from "vite";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Provider } from "react-redux";

const server = await createServer({
  server: { middlewareMode: true, hmr: false },
  appType: "custom",
});
try {
  const { store } = await server.ssrLoadModule("/src/app/store.ts");
  const { fetchCatalogue } = await server.ssrLoadModule(
    "/src/features/catalogue/slice.ts",
  );
  const { default: App } = await server.ssrLoadModule("/src/App.tsx");
  const { products, categories } = await server.ssrLoadModule(
    "/src/features/catalogue/data.ts",
  );
  const render = (path) => {
    globalThis.location = new URL(path, "http://localhost");
    return renderToStaticMarkup(
      createElement(Provider, { store }, createElement(App)),
    );
  };
  await test("loading skeletons are rendered before catalogue loads", () => {
    assert.match(render("/catalogue"), /Loading catalogue/);
  });
  await store.dispatch(fetchCatalogue());
  await test("homepage keeps its sections and links to real catalogue routes", () => {
    const html = render("/");
    for (const text of [
      "Recommended Products",
      "Featured Products",
      "Arrivals",
      "Grow with",
      "Subscribe",
    ])
      assert.ok(html.includes(text));
    assert.match(html, /href="\/products\/0"/);
    assert.match(html, /href="\/categories\/electronics"/);
    assert.ok(!html.includes("demo cart"));
  });
  await test("category directory and category product navigation render", () => {
    for (const category of categories)
      assert.ok(render("/categories").includes(`/categories/${category.id}`));
    const html = render("/categories/beauty");
    assert.match(html, /Cerave/);
    assert.ok(!html.includes('href="/products/0"'));
  });
  await test("product details, gallery, specifications and enabled cart action render", () => {
    const html = render("/products/4");
    assert.match(html, /View image 1/);
    assert.match(html, /Description &amp; specifications/);
    assert.ok(!html.includes("cart-note"));
    assert.match(html, /Add to Cart/);
  });
  await test("invalid routes and empty searches render helpful feedback", () => {
    for (const path of [
      "/categories/missing",
      "/products/missing",
      "/missing",
      "/catalogue/extra",
    ])
      assert.match(render(path), /Page not found/);
    assert.match(render("/catalogue?q=unfindable"), /No products found/);
  });
  await test("every navigation target has a valid mock id and every image exists", () => {
    for (const product of products) {
      assert.ok(
        categories.some((category) => category.id === product.categoryId),
      );
      for (const image of product.images)
        assert.ok(existsSync(`public${image}`));
      assert.ok(
        render(`/products/${product.id}`).includes(
          product.specifications["Product code"],
        ),
      );
    }
    for (const category of categories)
      assert.ok(existsSync(`public${category.image}`));
  });
  await test("rejected catalogue load exposes retry feedback", () => {
    store.dispatch({ type: fetchCatalogue.rejected.type });
    assert.match(render("/catalogue"), /Try again/);
  });
} finally {
  await server.close();
  delete globalThis.location;
}
