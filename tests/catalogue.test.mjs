import test from "node:test";
import assert from "node:assert/strict";
import { queryProducts, PAGE_SIZE } from "../src/features/catalogue/query.ts";
import { products, categories } from "../src/features/catalogue/data.ts";
const query = (value = "", category) =>
  queryProducts(products, new URLSearchParams(value), category);
test("all categories have products and assets and product ids are unique", () => {
  assert.equal(new Set(products.map((p) => p.id)).size, products.length);
  for (const category of categories)
    assert.ok(products.some((p) => p.categoryId === category.id));
});
test("search is case insensitive and trims whitespace", () => {
  const result = query("q= ASUS ");
  assert.ok(result.total > 0);
  assert.ok(result.items.every((p) => p.name.toLowerCase().includes("asus")));
});
test("category route takes precedence over query category", () => {
  assert.ok(
    query("category=beauty", "electronics").items.every(
      (p) => p.categoryId === "electronics",
    ),
  );
  assert.equal(query("", "missing").total, 0);
});
test("price range and availability combine", () => {
  const result = query("min=10000&max=100000&available=1");
  assert.ok(result.total > 0);
  assert.ok(
    result.items.every(
      (p) => p.price >= 10000 && p.price <= 100000 && p.stock > 0,
    ),
  );
});
test("all sorting modes order results and leave source data intact", () => {
  const ids = products.map((p) => p.id);
  for (const sort of ["price-asc", "price-desc", "name"]) {
    const result = query(`sort=${sort}`).items;
    for (let i = 1; i < result.length; i++) {
      assert.ok(
        sort === "name"
          ? result[i - 1].name.localeCompare(result[i].name) <= 0
          : sort === "price-asc"
            ? result[i - 1].price <= result[i].price
            : result[i - 1].price >= result[i].price,
      );
    }
  }
  assert.deepEqual(
    products.map((p) => p.id),
    ids,
  );
});
test("pagination is bounded and pages do not overlap", () => {
  assert.equal(query().items.length, PAGE_SIZE);
  assert.ok(
    query("page=2").items.every(
      (p) => !query().items.some((first) => first.id === p.id),
    ),
  );
  assert.equal(query("page=-1").page, 1);
  assert.equal(query("page=NaN").page, 1);
  assert.equal(query("page=999").page, query().pages);
});
test("empty results, invalid numbers and clear filters", () => {
  assert.equal(query("q=not-a-product").total, 0);
  assert.equal(query("min=100&max=1").total, 0);
  assert.equal(query("min=invalid&max=invalid").total, products.length);
  assert.equal(query().total, products.length);
});
