import { useState } from "react";
export default function StoreFooter() {
  const [subscribed, setSubscribed] = useState(false);
  const [notice, setNotice] = useState("");
  return (
    <>
      {" "}
      <section className="newsletter">
        <div className="container newsletter-inner">
          <div>
            <h2>Stay Ahead with Cadna Mart</h2>
            <p>
              Subscribe to receive exclusive deals, product launches, and
              <br /> insights — delivered straight to your inbox.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSubscribed(true);
              }}
            >
              <label htmlFor="email">Stay up-to-date with us</label>
              <div>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter email"
                  required
                  aria-describedby="subscribe-result"
                />
                <button type="submit">Subscribe</button>
              </div>
              <p id="subscribe-result" role="status">
                {subscribed
                  ? "Thanks! Your subscription has been recorded for this demo."
                  : ""}
              </p>
            </form>
          </div>
          <img src="/images/newsletter.png" alt="" loading="lazy" />
        </div>
      </section>
      <footer id="footer">
        <div className="container">
          <div className="footer-grid">
            <div>
              <img
                className="footer-logo"
                src="/images/footer-logo.png"
                alt="Cadna Mart"
                width={217}
                height={80}
                loading="lazy"
                decoding="async"
              />
              <p>
                Cadna Mart is your trusted hybrid e-commerce platform. Sourcing
                directly from manufacturers to bring you best prices.
              </p>
            </div>
            {[
              [
                "ABOUT US",
                "About Cadna Mart",
                "Careers",
                "Privacy Policy",
                "Terms & Conditions",
              ],
              [
                "CUSTOMER SERVICE",
                "Help Center",
                "How to Shop",
                "Delivery Options",
                "Return Policy",
              ],
              ["GROW WITH CADNA", "Sell with Cadna", "Become an Investor"],
            ].map(([title, ...links]) => (
              <div key={title}>
                <h3>{title}</h3>
                {links.map((link) => (
                  <button
                    key={link}
                    onClick={() =>
                      setNotice(
                        `${link} information is planned for a future milestone.`,
                      )
                    }
                  >
                    {link}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="footer-bottom">
            <small>
              © {new Date().getFullYear()} CADNA MART. ALL RIGHTS RESERVED.
            </small>
            <span>CADNA MART</span>
          </div>
        </div>
      </footer>
      {notice && (
        <div className="notice" role="status">
          {notice}
          <button
            onClick={() => setNotice("")}
            aria-label="Dismiss notification"
          >
            ?
          </button>
        </div>
      )}
    </>
  );
}
