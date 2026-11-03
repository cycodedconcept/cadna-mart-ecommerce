import { useState } from "react";
import { useAppSelector } from "../app/hooks";
import AccountLayout from "../components/account/AccountLayout";
import OrderList from "../components/orders/OrderList";
import OrdersFeedback from "../components/orders/OrdersFeedback";
import {
  selectCustomerOrders,
  selectFilteredOrders,
  type OrderQuery,
} from "../features/orders/slice";
import { orderStatuses, statusLabels } from "../features/orders/types";

const initialQuery: OrderQuery = { search: "", status: "", sort: "newest" };
export default function OrdersPage() {
  const [query, setQuery] = useState<OrderQuery>(initialQuery);
  const all = useAppSelector(selectCustomerOrders);
  const orders = useAppSelector((state) => selectFilteredOrders(state, query));
  const ready = useAppSelector((state) => state.orders.status === "ready");
  return (
    <AccountLayout title="Order history" section="orders">
      <OrdersFeedback />
      {ready && (
        <>
          <div className="order-controls">
            <label>
              Search orders
              <input
                type="search"
                placeholder="Reference or product name"
                value={query.search}
                onChange={(event) =>
                  setQuery({ ...query, search: event.target.value })
                }
              />
            </label>
            <label>
              Status
              <select
                value={query.status}
                onChange={(event) =>
                  setQuery({
                    ...query,
                    status: event.target.value as OrderQuery["status"],
                  })
                }
              >
                <option value="">All statuses</option>
                {orderStatuses.map((status) => (
                  <option key={status} value={status}>
                    {statusLabels[status]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Sort orders
              <select
                value={query.sort}
                onChange={(event) =>
                  setQuery({
                    ...query,
                    sort: event.target.value as OrderQuery["sort"],
                  })
                }
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="total-asc">Total: low to high</option>
                <option value="total-desc">Total: high to low</option>
              </select>
            </label>
            <button
              className="clear-button"
              onClick={() => setQuery(initialQuery)}
            >
              Clear filters
            </button>
          </div>
          <p className="orders-result-count" role="status">
            {orders.length} demo orders
          </p>
          {orders.length ? (
            <OrderList orders={orders} />
          ) : all.length ? (
            <div className="empty-state">
              <h2>No matching orders</h2>
              <p>Try another reference, product name or status.</p>
              <button
                className="clear-button"
                onClick={() => setQuery(initialQuery)}
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <h2>No demo orders yet</h2>
              <p>
                Orders placed while signed in appear here. Guest orders stay
                separate.
              </p>
              <a className="primary-button checkout-link" href="/catalogue">
                Continue shopping
              </a>
            </div>
          )}
        </>
      )}
    </AccountLayout>
  );
}
