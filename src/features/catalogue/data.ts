import {
  categories as names,
  products as homeProducts,
} from "../../data/home.ts";
import type { Category, Product } from "./types.ts";

export const categoryId = (name: string) =>
  name.toLowerCase().replaceAll(" & ", "-").replaceAll(" ", "-");
export const categories: Category[] = names.map((name, index) => ({
  id: categoryId(name),
  name,
  image: `/images/category-${index}.png`,
}));
export const products: Product[] = homeProducts.map((product) => ({
  ...product,
  categoryId: categoryId(product.category),
  images: [`/images/product-${product.id}.png`],
  description: `${product.name}. Explore this selection from our ${product.category.toLowerCase()} collection. Prices and availability are illustrative mock data.`,
  stock: product.id % 7 === 6 ? 0 : 23,
  specifications: {
    Category: product.category,
    "Product code": `CAD-${String(product.id).padStart(4, "0")}`,
    Condition: "New",
  },
}));

// Replace this adapter when a documented API is available.
export async function loadCatalogue(): Promise<{
  products: Product[];
  categories: Category[];
}> {
  return { products, categories };
}
