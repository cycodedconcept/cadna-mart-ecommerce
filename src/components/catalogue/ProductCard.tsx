import AddToCartButton from "../cart/AddToCartButton";
import { formatPrice } from "../../data/home";
import type { Product } from "../../features/catalogue/types";

export default function ProductCard({ product }: { product: Product }) {
  const discount = Math.round(
    (1 - product.price / product.originalPrice) * 100,
  );
  return (
    <article className="product-card">
      <a href={`/products/${product.id}`}>
        <div className="product-image">
          <img src={product.images[0]} alt={product.name} loading="lazy" decoding="async" />
          {discount > 0 && <span className="discount">-{discount}%</span>}
        </div>
        <div className="product-copy">
          <h3>{product.name}</h3>
          <div className="rating">
            <span aria-label="Rated 4.5 out of 5">★★★★★</span>{" "}
            <small>4.5 (demo)</small>
          </div>
          <div className="prices">
            <strong>{formatPrice(product.price)}</strong>
            {discount > 0 && <del>{formatPrice(product.originalPrice)}</del>}
          </div>
          <p className="saving">
            {product.stock ? "In stock" : "Out of stock"}
          </p>
        </div>
      </a>
      <AddToCartButton product={product} />
    </article>
  );
}
