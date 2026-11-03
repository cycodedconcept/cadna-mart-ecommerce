import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  clearCart,
  findProduct,
  itemKey,
  lineTotal,
  removeItem,
  setQuantity,
} from "../features/cart/slice";
import { formatPrice } from "../data/home";
import OrderSummary from "../components/cart/OrderSummary";

export default function CartPage() {
  const cart = useAppSelector((state) => state.cart);
  const dispatch = useAppDispatch();
  return (
    <>
      <h1>Shopping cart</h1>
      {cart.items.length ? (
        <div className="purchase-layout">
          <section aria-label="Cart items">
            <div className="cart-toolbar">
              <a href="/catalogue">Continue shopping</a>
              <button
                className="clear-button"
                onClick={() => dispatch(clearCart())}
              >
                Clear cart
              </button>
            </div>
            <ul className="cart-items">
              {cart.items.map((item) => {
                const product = findProduct(item);
                return (
                  <li className="cart-row" key={itemKey(item)}>
                    <a href={`/products/${product.id}`}>
                      <img src={product.images[0]} alt={product.name} />
                    </a>
                    <div>
                      <a
                        className="cart-product-name"
                        href={`/products/${product.id}`}
                      >
                        {product.name}
                      </a>
                      <p>Unit price: {formatPrice(product.price)}</p>
                      <div className="quantity">
                        <label htmlFor={`qty-${product.id}`}>Quantity</label>
                        <button
                          aria-label={`Decrease quantity for ${product.name}`}
                          disabled={item.quantity <= 1}
                          onClick={() =>
                            dispatch(
                              setQuantity({
                                ...item,
                                quantity: item.quantity - 1,
                              }),
                            )
                          }
                        >
                          −
                        </button>
                        <input
                          id={`qty-${product.id}`}
                          type="number"
                          min="1"
                          max={product.stock}
                          step="1"
                          value={item.quantity}
                          onChange={(event) =>
                            dispatch(
                              setQuantity({
                                ...item,
                                quantity: Number(event.target.value),
                              }),
                            )
                          }
                        />
                        <button
                          aria-label={`Increase quantity for ${product.name}`}
                          disabled={item.quantity >= product.stock}
                          onClick={() =>
                            dispatch(
                              setQuantity({
                                ...item,
                                quantity: item.quantity + 1,
                              }),
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                      <small>{product.stock} available</small>
                      <button
                        className="remove-button"
                        aria-label={`Remove ${product.name}`}
                        onClick={() => dispatch(removeItem(itemKey(item)))}
                      >
                        Remove
                      </button>
                    </div>
                    <strong>{formatPrice(lineTotal(item) / 100)}</strong>
                  </li>
                );
              })}
            </ul>
          </section>
          <aside>
            <OrderSummary cart={cart} />
            <a className="primary-button checkout-link" href="/checkout">
              Proceed to demo checkout
            </a>
          </aside>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Find something you love in our catalogue.</p>
          <a className="primary-button checkout-link" href="/catalogue">
            Continue shopping
          </a>
        </div>
      )}
    </>
  );
}
