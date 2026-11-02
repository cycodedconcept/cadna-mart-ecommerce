import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { addItem } from "../../features/cart/slice";
import type { Product } from "../../features/catalogue/types";

export default function AddToCartButton({
  product,
  quantity = 1,
}: {
  product: Product;
  quantity?: number;
}) {
  const dispatch = useAppDispatch();
  const [added, setAdded] = useState(false);
  const count = useAppSelector(
    (state) =>
      state.cart.items.find((item) => item.productId === product.id)
        ?.quantity ?? 0,
  );
  const pending = useAppSelector(
    (state) => state.checkout.status === "submitting",
  );
  const full = count >= product.stock;
  return (
    <div className="cart-action">
      <button
        className="primary-button"
        disabled={!product.stock || full || pending}
        onClick={() => {
          dispatch(addItem({ productId: product.id, quantity }));
          setAdded(true);
        }}
      >
        {!product.stock
          ? "Out of stock"
          : full
            ? "Stock limit reached"
            : "Add to Cart"}
      </button>
      <span role="status">
        {added && <a href="/cart">Added · View cart</a>}
      </span>
    </div>
  );
}
