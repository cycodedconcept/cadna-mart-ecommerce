import { useAppSelector } from "../../app/hooks";
import { selectOrderSummary } from "../../features/orders/slice";
import OrderList from "./OrderList";
import OrdersFeedback from "./OrdersFeedback";

export default function OrderDashboard() {
  const summary = useAppSelector(selectOrderSummary);
  const ready = useAppSelector((state) => state.orders?.status === "ready");
  return (
    <section className="dashboard-orders" aria-label="Demo order overview">
      <h2>Your demo orders</h2>
      <OrdersFeedback />
      {ready && (
        <>
          <dl className="order-statistics">
            <div>
              <dt>Total orders</dt>
              <dd>{summary.total}</dd>
            </div>
            <div>
              <dt>Pending orders</dt>
              <dd>{summary.pending}</dd>
            </div>
            <div>
              <dt>Delivered orders</dt>
              <dd>{summary.delivered}</dd>
            </div>
          </dl>
          <div className="orders-heading">
            <h3>Recent orders</h3>
            <a href="/account/orders">View all orders</a>
          </div>
          {summary.recent.length ? (
            <OrderList orders={summary.recent} />
          ) : (
            <div className="empty-state">
              <p>No demo orders yet.</p>
              <a href="/catalogue">Continue shopping</a>
            </div>
          )}
        </>
      )}
    </section>
  );
}
