import { formatPrice } from "../../data/home";
import {
  findProduct,
  itemKey,
  lineTotal,
  selectCartTotal,
  type CartState,
} from "../../features/cart/slice";

export default function OrderSummary({ cart }: { cart: CartState }) {
  const total = selectCartTotal({ cart });
  return (
    <section className="order-summary" aria-label="Order review">
      <h2>Order summary</h2>
      <ul>
        {cart.items.map((item) => {
          const product = findProduct(item);
          return (
            <li key={itemKey(item)}>
              <span>
                {product.name}
                <small>
                  {item.quantity} × {formatPrice(product.price)}
                </small>
              </span>
              <strong>{formatPrice(lineTotal(item) / 100)}</strong>
            </li>
          );
        })}
      </ul>
      <dl className="order-totals">
        <div>
          <dt>Subtotal</dt>
          <dd>{formatPrice(total / 100)}</dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatPrice(total / 100)}</dd>
        </div>
      </dl>
      <p className="muted">
        Demo product total only. No shipping charges, taxes or discounts are
        applied. No payment is collected.
      </p>
    </section>
  );
}
