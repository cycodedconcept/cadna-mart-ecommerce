import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { loadOrders } from "../../features/orders/slice";

export default function OrdersFeedback() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((state) => state.orders);
  if (!state || state.status === "idle" || state.status === "loading")
    return (
      <p role="status" className="orders-feedback">
        Loading demo orders…
      </p>
    );
  if (state.status === "error")
    return (
      <div role="alert" className="orders-feedback">
        <p>{state.error}</p>
        <button
          className="primary-button"
          onClick={() => void dispatch(loadOrders())}
        >
          Try again
        </button>
      </div>
    );
  return state.warning ? (
    <p role="status" className="demo-notice">
      {state.warning}
    </p>
  ) : null;
}
