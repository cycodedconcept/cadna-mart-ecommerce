import { useAppSelector } from "../app/hooks";
import { selectCartQuantity } from "../features/cart/slice";
import { categories } from "../features/catalogue/data";
import { selectCustomer } from "../features/auth/slice";
import { navigate } from "../features/auth/navigation";

export default function StoreHeader() {
  const count = useAppSelector(selectCartQuantity);
  const customer = useAppSelector(selectCustomer);
  return (
    <>
      <nav className="category-nav container" aria-label="Main categories">
        <a href="/categories">&#9776; All Categories</a>
        {categories.map((category) => (
          <a key={category.id} href={`/categories/${category.id}`}>
            {category.name}
          </a>
        ))}
        <a href="/catalogue">All Products</a>
      </nav>
      <div className="delivery-strip">
        Free Delivery on Orders Above &#8358;50,000 |{" "}
        <a href="/catalogue">Shop Now</a>
      </div>
      <header className="store-header container">
        <a href="/" aria-label="Cadna Mart home">
          <img className="brand-logo" src="/images/logo.png" alt="Cadna Mart" />
        </a>
        <a className="header-partner" href="/#grow">
          Sell on Cadna
        </a>
        <a className="header-partner" href="/#grow">
          Earn as a Partner
        </a>
        <form
          className="search"
          role="search"
          action="/catalogue"
          onSubmit={(event) => {
            event.preventDefault();
            const query = new FormData(event.currentTarget).get("q");
            navigate(`/catalogue?q=${encodeURIComponent(String(query ?? ""))}`);
          }}
        >
          <input
            name="q"
            aria-label="Search products"
            placeholder="Search for products, brands and categories…"
            defaultValue={new URLSearchParams(location.search).get("q") ?? ""}
          />
          <button aria-label="Search">&#9906;</button>
        </form>
        <a className="header-action" href={customer ? "/account" : "/login"}>
          {customer ? "My account" : "Sign in"}
        </a>
        <a className="header-action" href="#footer">
          Help
        </a>
        <a
          className="header-action"
          href="/cart"
          aria-label={`Cart, ${count} items`}
        >
          Cart ({count})
        </a>
      </header>
    </>
  );
}
