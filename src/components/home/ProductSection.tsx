import type { Product } from "../../features/catalogue/types";
import ProductCard from "../catalogue/ProductCard";
interface Props {
  title: string;
  accent: string;
  products: Product[];
}
export default function ProductSection({ title, accent, products }: Props) {
  return (
    <section className="product-section" aria-label={title}>
      <div className="section-heading">
        <h2>
          {title} <span>{accent}</span>
        </h2>
        <a href="/catalogue">View All ?</a>
      </div>
      {products.length ? (
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="empty-state">
          No products match your search in this section.
        </p>
      )}
    </section>
  );
}
