import AddToCartButton from "../components/cart/AddToCartButton";
import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import { fetchCatalogue } from "../features/catalogue/slice";
import { queryProducts } from "../features/catalogue/query";
import { formatPrice } from "../data/home";
import StoreHeader from "../components/StoreHeader";
import StoreFooter from "../components/StoreFooter";
import ProductCard from "../components/catalogue/ProductCard";
import CategoryCard from "../components/catalogue/CategoryCard";

export default function CataloguePage() {
  const dispatch = useAppDispatch();
  const { products, categories, status } = useAppSelector(
    (state) => state.catalogue,
  );
  const [search, setSearch] = useState(location.search);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const segments = location.pathname.split("/").filter(Boolean);
  const isProduct = segments[0] === "products";
  const isCategory = segments[0] === "categories" && segments.length === 2;
  const category = categories.find((item) => item.id === segments[1]);
  const product = products.find((item) => String(item.id) === segments[1]);
  const params = new URLSearchParams(search);
  const result = queryProducts(
    products,
    params,
    isCategory ? segments[1] : undefined,
  );
  useEffect(() => {
    if (status === "idle") void dispatch(fetchCatalogue());
  }, [dispatch, status]);
  useEffect(() => {
    const update = () => setSearch(location.search);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(search);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    const query = next.toString();
    history.pushState(
      null,
      "",
      `${location.pathname}${query ? `?${query}` : ""}`,
    );
    setSearch(location.search);
  };
  const clear = () => {
    history.pushState(null, "", location.pathname);
    setSearch("");
  };
  const loading = status === "idle" || status === "loading";
  const invalid =
    !loading &&
    status === "ready" &&
    ((isCategory && !category) ||
      (isProduct && !product) ||
      segments.length > 2 ||
      !["categories", "catalogue", "products"].includes(segments[0]) ||
      (segments[0] === "catalogue" && segments.length !== 1));
  const title = invalid
    ? "Page not found"
    : isProduct
      ? (product?.name ?? "Product")
      : isCategory
        ? (category?.name ?? "Category")
        : segments[0] === "categories"
          ? "Shop by category"
          : "All products";
  useEffect(() => {
    document.title = `${title} | Cadna Mart`;
  }, [title]);
  return (
    <>
      <StoreHeader />
      <main className="catalogue-main container" id="main-content">
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/catalogue">Catalogue</a>
          {product && (
            <>
              <span>/</span>
              <a href={`/categories/${product.categoryId}`}>
                {
                  categories.find((item) => item.id === product.categoryId)
                    ?.name
                }
              </a>
            </>
          )}
          <span>/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        {loading ? (
          <div
            className="product-grid"
            role="status"
            aria-label="Loading catalogue"
          >
            {Array.from({ length: 8 }, (_, index) => (
              <div className="product-skeleton" key={index} />
            ))}
            <span className="visually-hidden">Loading products…</span>
          </div>
        ) : status === "error" ? (
          <div className="empty-state" role="alert">
            <p>We couldn’t load the catalogue.</p>
            <button
              className="primary-button"
              onClick={() => void dispatch(fetchCatalogue())}
            >
              Try again
            </button>
          </div>
        ) : invalid ? (
          <div className="empty-state">
            <p>We couldn’t find this page.</p>
            <a href="/catalogue">Browse all products</a>
          </div>
        ) : isProduct && product ? (
          <>
            <div className="product-detail">
              <section aria-label="Product gallery">
                <div className="detail-image">
                  <img src={product.images[imageIndex]} alt={product.name} />
                </div>
                <div className="thumbnails">
                  {product.images.map((image, index) => (
                    <button
                      key={image}
                      aria-label={`View image ${index + 1}`}
                      aria-pressed={imageIndex === index}
                      onClick={() => setImageIndex(index)}
                    >
                      <img src={image} alt="" />
                    </button>
                  ))}
                </div>
              </section>
              <section className="detail-copy">
                <p className="eyebrow">
                  {product.specifications["Product code"]}
                </p>
                <h2>{product.name}</h2>
                <div className="prices">
                  <strong>{formatPrice(product.price)}</strong>
                  {product.originalPrice > product.price && (
                    <del>{formatPrice(product.originalPrice)}</del>
                  )}
                </div>
                {product.originalPrice > product.price && (
                  <p className="saving">
                    You save{" "}
                    {formatPrice(product.originalPrice - product.price)}
                  </p>
                )}
                <p>{product.description}</p>
                <p>
                  {product.stock
                    ? `${product.stock} units available`
                    : "Out of stock"}
                </p>
                <div className="quantity">
                  <label htmlFor="quantity">Quantity</label>
                  <button
                    aria-label="Decrease quantity"
                    disabled={quantity <= 1 || !product.stock}
                    onClick={() => setQuantity((value) => value - 1)}
                  >
                    −
                  </button>
                  <input
                    id="quantity"
                    type="number"
                    min="1"
                    max={product.stock || 1}
                    value={quantity}
                    disabled={!product.stock}
                    onChange={(event) =>
                      setQuantity(
                        Math.max(
                          1,
                          Math.min(
                            product.stock || 1,
                            Math.floor(Number(event.target.value)) || 1,
                          ),
                        ),
                      )
                    }
                  />
                  <button
                    aria-label="Increase quantity"
                    disabled={quantity >= product.stock}
                    onClick={() => setQuantity((value) => value + 1)}
                  >
                    +
                  </button>
                </div>
                <AddToCartButton product={product} quantity={quantity} />
              </section>
              <aside className="delivery-info">
                <h3>Delivery information</h3>
                <p>
                  Delivery options will be confirmed when checkout is available.
                </p>
                <h3>Returns & warranty</h3>
                <p>
                  Product-specific policies are not yet available for this mock
                  catalogue.
                </p>
              </aside>
            </div>
            <section className="specifications">
              <h2>Description & specifications</h2>
              <p>{product.description}</p>
              <dl>
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
            </section>
            <section className="product-section">
              <div className="section-heading">
                <h2>
                  Similar items <span>You May Like</span>
                </h2>
              </div>
              <div className="product-grid">
                {products
                  .filter(
                    (item) =>
                      item.categoryId === product.categoryId &&
                      item.id !== product.id,
                  )
                  .slice(0, 4)
                  .map((item) => (
                    <ProductCard key={item.id} product={item} />
                  ))}
              </div>
            </section>
          </>
        ) : segments[0] === "categories" && !isCategory ? (
          <section
            className="category-grid category-directory"
            aria-label="Product categories"
          >
            {categories.map((item) => (
              <CategoryCard key={item.id} category={item} />
            ))}
          </section>
        ) : (
          <>
            <p className="catalogue-intro">
              Find your next favourite at manufacturer prices.
            </p>
            <div className="catalogue-layout">
              <aside className="catalogue-filters">
                <h2>Filters</h2>
                <label htmlFor="catalogue-search">Search products</label>
                <input
                  id="catalogue-search"
                  value={params.get("q") ?? ""}
                  onChange={(event) => update("q", event.target.value)}
                />
                {!isCategory && (
                  <>
                    <label htmlFor="category-filter">Category</label>
                    <select
                      id="category-filter"
                      value={params.get("category") ?? ""}
                      onChange={(event) =>
                        update("category", event.target.value)
                      }
                    >
                      <option value="">All categories</option>
                      {categories.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </>
                )}
                <label htmlFor="min-price">Minimum price (₦)</label>
                <input
                  id="min-price"
                  type="number"
                  min="0"
                  value={params.get("min") ?? ""}
                  onChange={(event) => update("min", event.target.value)}
                />
                <label htmlFor="max-price">Maximum price (₦)</label>
                <input
                  id="max-price"
                  type="number"
                  min="0"
                  value={params.get("max") ?? ""}
                  onChange={(event) => update("max", event.target.value)}
                />
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={params.get("available") === "1"}
                    onChange={(event) =>
                      update("available", event.target.checked ? "1" : "")
                    }
                  />
                  In stock only
                </label>
                <button className="clear-button" onClick={clear}>
                  Clear filters
                </button>
              </aside>
              <section aria-label="Product results">
                <div className="catalogue-toolbar">
                  <p role="status">
                    {result.total} results · Page {result.page} of{" "}
                    {result.pages}
                  </p>
                  <label>
                    Sort by{" "}
                    <select
                      value={params.get("sort") ?? ""}
                      onChange={(event) => update("sort", event.target.value)}
                    >
                      <option value="">Default</option>
                      <option value="price-asc">Price: low to high</option>
                      <option value="price-desc">Price: high to low</option>
                      <option value="name">Name: A–Z</option>
                    </select>
                  </label>
                </div>
                {result.items.length ? (
                  <div className="product-grid">
                    {result.items.map((item) => (
                      <ProductCard key={item.id} product={item} />
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <h2>No products found</h2>
                    <p>Try another search or adjust your price range.</p>
                    <button className="clear-button" onClick={clear}>
                      Clear filters
                    </button>
                  </div>
                )}
                <nav className="pagination" aria-label="Product pages">
                  <button
                    disabled={result.page === 1}
                    onClick={() => update("page", String(result.page - 1))}
                  >
                    Previous
                  </button>
                  {Array.from({ length: result.pages }, (_, index) => (
                    <button
                      key={index}
                      aria-current={
                        result.page === index + 1 ? "page" : undefined
                      }
                      onClick={() => update("page", String(index + 1))}
                    >
                      {index + 1}
                    </button>
                  ))}
                  <button
                    disabled={result.page === result.pages}
                    onClick={() => update("page", String(result.page + 1))}
                  >
                    Next
                  </button>
                </nav>
              </section>
            </div>
          </>
        )}
      </main>
      <StoreFooter />
    </>
  );
}
