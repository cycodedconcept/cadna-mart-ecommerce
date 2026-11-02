import type { Product } from "./types.ts";

export const PAGE_SIZE = 8;
export function queryProducts(
  products: Product[],
  params: URLSearchParams,
  category?: string,
) {
  const query = (params.get("q") ?? "").trim().toLowerCase();
  const selectedCategory = category ?? params.get("category");
  const amount = (key: string, fallback: number) => {
    const raw = params.get(key);
    const value = raw?.trim() ? Number(raw) : NaN;
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  };
  const filtered = products.filter(
    (product) =>
      product.name.toLowerCase().includes(query) &&
      (!selectedCategory || product.categoryId === selectedCategory) &&
      product.price >= amount("min", 0) &&
      product.price <= amount("max", Infinity) &&
      (params.get("available") !== "1" || product.stock > 0),
  );
  switch (params.get("sort")) {
    case "price-asc":
      filtered.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      filtered.sort((a, b) => b.price - a.price);
      break;
    case "name":
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
  }
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const requested = Number(params.get("page"));
  const page = Number.isFinite(requested)
    ? Math.min(pages, Math.max(1, Math.floor(requested)))
    : 1;
  return {
    items: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    total: filtered.length,
    page,
    pages,
  };
}
