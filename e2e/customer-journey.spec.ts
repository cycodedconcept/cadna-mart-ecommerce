import { expect, test, type Page } from "@playwright/test";

// These exercise the existing local demo; no commerce backend is configured.
async function login(page: Page) {
  await page.getByLabel("Email address", { exact: true }).fill("browser@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Fictional!729");
  await page.getByRole("button", { name: "Sign in to demo", exact: true }).click();
}

async function addProduct(page: Page) {
  await page.goto("/products/0");
  await page.getByRole("button", { name: /Add to cart/i }).first().click();
}

test("direct protected page refresh opens usable login and restores intended route", async ({ page }) => {
  await page.goto("/account/addresses");
  await expect(page.getByRole("button", { name: "Sign in to demo", exact: true })).toBeVisible();
  await page.reload();
  await login(page);
  await expect(page.getByRole("heading", { name: "Saved addresses", exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Sign in to demo", exact: true })).toBeVisible();
});

test("discovery, category navigation, search, images and unavailable products", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: /All Categories/ }).click();
  await expect(page.getByRole("heading", { name: "Shop by category" })).toBeVisible();
  await page.getByRole("link", { name: "Electronics", exact: true }).last().click();
  await expect(page).toHaveURL(/\/categories\/electronics/);
  await page.getByRole("search").getByRole("textbox", { name: "Search products" }).fill("Zenbook");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.getByLabel("Sort by").selectOption("price-desc");
  await expect(page.locator(".product-card h3").first()).toContainText("Zenbook Duo");
  await page.getByLabel("Maximum price", { exact: false }).fill("100");
  await expect(page.locator(".product-card")).toHaveCount(0);
  await page.getByLabel("Maximum price", { exact: false }).fill("");
  await expect(page.locator(".product-card")).toHaveCount(2);
  await page.locator(".product-card a").first().click();
  await expect(page.locator(".detail-image img")).toBeVisible();
  await expect.poll(() => page.locator(".detail-image img").evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await page.goto("/products/6");
  await expect(page.locator(".detail-copy").getByRole("button", { name: "Out of stock", exact: true })).toBeDisabled();
});

test("cart quantities, totals, refresh persistence, removal and empty state", async ({ page }) => {
  await addProduct(page);
  await page.getByRole("link", { name: /Cart, 1 items/ }).click();
  await page.getByRole("spinbutton", { name: "Quantity" }).fill("2");
  await expect(page.getByRole("link", { name: /Cart, 2 items/ })).toBeVisible();
  await expect(page.locator(".cart-row > strong")).toHaveText(/2,467,400/);
  await page.reload();
  await expect(page.getByRole("spinbutton", { name: "Quantity" })).toHaveValue("2");
  await page.getByRole("button", { name: /^Remove / }).click();
  await expect(page.getByRole("heading", { name: "Your cart is empty" })).toBeVisible();
});

test("account profile, address, demo checkout, order history and logout journey", async ({ page }) => {
  await page.goto("/account/profile");
  await login(page);
  await page.getByLabel("Full name", { exact: true }).fill("Browser Customer");
  await page.getByLabel("Phone number", { exact: true }).fill("08012345678");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByText(/Demo profile updated/)).toBeVisible();
  await page.getByRole("link", { name: "Saved addresses", exact: true }).click();
  await page.getByRole("button", { name: "Add new address", exact: true }).click();
  await page.getByLabel("Address label").fill("Demo home");
  await page.getByLabel("Street address").fill("12 Fictional Road");
  await page.getByLabel("City", { exact: true }).fill("Lagos");
  await page.getByLabel("State", { exact: true }).fill("Lagos");
  await page.getByRole("button", { name: "Save address", exact: true }).click();
  await expect(page.getByText("Default address", { exact: true })).toBeVisible();
  // Use in-app navigation so the intentionally memory-only session survives.
  await page.getByRole("link", { name: "All Products", exact: true }).click();
  await page.locator(".product-card").first().getByRole("button", { name: /Add to cart/i }).click();
  await page.getByRole("link", { name: /Cart, 1 items/ }).click();
  await page.getByRole("link", { name: "Proceed to demo checkout" }).click();
  await expect(page.locator("#address")).toHaveValue("12 Fictional Road");
  await page.getByRole("button", { name: "Submit demo order", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Thank you, Browser Customer!" })).toBeVisible();
  await page.getByRole("link", { name: "View saved order", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Order details", exact: true })).toBeVisible();
  await page.getByRole("link", { name: "Back to order history" }).click();
  await expect(page.locator(".order-card")).toHaveCount(1);
  await page.getByRole("button", { name: /Log out|Sign out/ }).click();
  await page.goto("/account/orders");
  await expect(page.getByRole("button", { name: "Sign in to demo", exact: true })).toBeVisible();
});

test("invalid checkout focuses first error and storage failure preserves cart for retry", async ({ page }) => {
  await addProduct(page);
  await page.getByRole("link", { name: /Cart, 1 items/ }).click();
  await page.getByRole("link", { name: "Proceed to demo checkout" }).click();
  await page.getByRole("button", { name: "Submit demo order", exact: true }).click();
  await expect(page.getByLabel("Full name", { exact: false })).toBeFocused();
  for (const [name, value] of [["Full name", "Demo Guest"], ["Email address", "guest@example.com"], ["Phone number", "08012345678"], ["Delivery address", "12 Fictional Road"], ["City", "Lagos"], ["State", "Lagos"]]) {
    await page.getByLabel(name, { exact: false }).fill(value);
  }
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "cadna-orders-v1") throw new DOMException("Simulated storage failure", "QuotaExceededError");
      original.call(this, key, value);
    };
  });
  await page.getByRole("button", { name: "Submit demo order", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("Your cart has been preserved");
  await expect(page.getByRole("link", { name: /Cart, 1 items/ })).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Full name", { exact: false })).toHaveValue("");
});

test("keyboard skip link, responsive layout and direct page refresh", async ({ page }, testInfo) => {
  for (const route of ["/", "/catalogue", "/products/0", "/cart", "/login"]) {
    await page.goto(route);
    await expect(page.locator("main")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
    await page.reload();
    await expect(page.locator("main")).toBeVisible();
  }
  await page.goto("/catalogue");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/#main-content$/);
  await page.screenshot({ path: testInfo.outputPath("catalogue.png"), fullPage: true });
});

test("demo login failure retries successfully and settings remain explicitly local", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Email address", { exact: true }).fill("fail@example.com");
  await page.getByLabel("Password", { exact: true }).fill("Fictional!729");
  await page.getByRole("button", { name: "Sign in to demo", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("could not be completed");
  await login(page);
  await page.getByRole("link", { name: "Account settings", exact: true }).click();
  await page.getByLabel("Offers and promotions").check();
  await page.getByRole("button", { name: "Save preferences", exact: true }).click();
  await expect(page.getByText(/Preferences updated/)).toBeVisible();
  await expect(page.getByRole("button", { name: /Change password/i })).toBeDisabled();
});
