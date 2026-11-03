import StoreHeader from "../components/StoreHeader";
import StoreFooter from "../components/StoreFooter";
import CategoryCard from "../components/catalogue/CategoryCard";
import { categories as catalogueCategories } from "../features/catalogue/data";
import { useState } from "react";
import ProductSection from "../components/home/ProductSection";
import { products } from "../features/catalogue/data";
export default function HomePage() {
  const [notice, setNotice] = useState("");
  const filtered = (start: number, end: number) => products.slice(start, end);
  return (
    <>
      <StoreHeader />
      <main id="main-content">
        <h1 className="visually-hidden">
          Cadna Mart ? Shop smarter. Delivered faster.
        </h1>
        <div className="container">
          <a className="hero-banner" href="#deals">
            <img
              src="/images/hero.png"
              alt="Welcome to Cadna Mart. Shop smarter. Delivered faster. Shop direct from manufacturers at unbeatable prices. Fast delivery across Nigeria. Shop now."
            />
          </a>
          <div id="deals">
            <ProductSection
              title="Grab the best"
              accent="deals"
              products={filtered(0, 8)}
            />
          </div>
        </div>
        <section className="categories-band" id="categories">
          <div className="container">
            <div className="section-heading">
              <h2>
                Shop From <span>Top Categories</span>
              </h2>
              <a href="/categories">View All ›</a>
            </div>
            <div className="category-grid">
              {catalogueCategories.map((item) => (
                <CategoryCard key={item.id} category={item} />
              ))}
            </div>
          </div>
        </section>
        <div className="container">
          <ProductSection
            title="Recommended Products"
            accent="For You"
            products={filtered(8, 14)}
          />
          <ProductSection
            title="Featured Products"
            accent="From Our Top Sellers"
            products={filtered(14, 20)}
          />
          <a className="sale-banner" href="#arrivals">
            <img
              src="/images/flash-sale.png"
              alt="Flash sale. Get up to 30% off selected kitchen and tools. Limited stock. Shop now."
              loading="lazy"
            />
          </a>
          <div id="arrivals">
            <ProductSection
              title="New"
              accent="Arrivals"
              products={filtered(20, 26)}
            />
          </div>
          <section className="grow" id="grow">
            <span className="eyebrow">PARTNERSHIP</span>
            <h2>
              Grow with <span>Cadna Mart</span>
            </h2>
            <p>
              Grow, sell, and invest with Cadna Mart — your gateway to
              <br /> opportunity and lasting impact.
            </p>
            <div className="partner-grid">
              <button
                onClick={() =>
                  setNotice(
                    "Seller registration is planned for a future milestone.",
                  )
                }
              >
                <img
                  src="/images/sell.png"
                  alt="Sell more. Grow more. Reach thousands of customers. Start selling."
                  loading="lazy"
                />
              </button>
              <button
                onClick={() =>
                  setNotice(
                    "Partner registration is planned for a future milestone.",
                  )
                }
              >
                <img
                  src="/images/partner.png"
                  alt="Partner with Cadna Mart. Be part of our growth journey. Earn as an investor."
                  loading="lazy"
                />
              </button>
            </div>
          </section>
        </div>
      </main>
      <StoreFooter />
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
