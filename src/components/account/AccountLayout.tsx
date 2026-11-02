import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import {
  subscribeAccountPersistence,
  getAccountPersistenceSnapshot,
  getServerPersistenceSnapshot,
} from "../../app/store";
import { useAppDispatch, useAppSelector } from "../../app/hooks";
import StoreHeader from "../StoreHeader";
import StoreFooter from "../StoreFooter";
import { logout, selectCustomerId } from "../../features/auth/slice";
import { navigate } from "../../features/auth/navigation";
import { loadOrders } from "../../features/orders/slice";

export default function AccountLayout({
  title,
  section,
  children,
}: {
  title: string;
  section: "overview" | "profile" | "orders" | "addresses" | "settings";
  children: ReactNode;
}) {
  const dispatch = useAppDispatch();
  const storageFailed = useSyncExternalStore(
    subscribeAccountPersistence,
    getAccountPersistenceSnapshot,
    getServerPersistenceSnapshot,
  );
  const customerId = useAppSelector(selectCustomerId);
  const status = useAppSelector((state) => state.orders?.status ?? "idle");
  useEffect(() => {
    document.title = `${title} | Cadna Mart`;
    document.getElementById("main-content")?.focus();
  }, [title]);
  useEffect(() => {
    if (customerId && status === "idle") void dispatch(loadOrders());
  }, [customerId, status, dispatch]);
  return (
    <>
      <StoreHeader />
      <main
        className="catalogue-main account-main container"
        id="main-content"
        tabIndex={-1}
      >
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/account">My account</a>
          <span>/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h1>{title}</h1>
        <p className="demo-notice">
          Demo account for this visit. Refresh ends the session; sign in with
          the same demo email to retrieve saved orders. Order history stores
          fictional delivery details only. Client-side isolation is not real
          authorization.
        </p>
        <div className="account-layout">
          <nav className="account-nav" aria-label="Account navigation">
            <a
              href="/account"
              aria-current={section === "overview" ? "page" : undefined}
            >
              Account overview
            </a>
            <a
              href="/account/profile"
              aria-current={section === "profile" ? "page" : undefined}
            >
              Edit profile
            </a>
            <a
              href="/account/orders"
              aria-current={section === "orders" ? "page" : undefined}
            >
              Order history
            </a>
            <a href="/catalogue">Continue shopping</a>
            <a
              href="/account/addresses"
              aria-current={section === "addresses" ? "page" : undefined}
            >
              Saved addresses
            </a>
            <a
              href="/account/settings"
              aria-current={section === "settings" ? "page" : undefined}
            >
              Account settings
            </a>
            <button
              className="clear-button"
              onClick={() => {
                dispatch(logout());
                navigate("/login", true);
              }}
            >
              Log out
            </button>
          </nav>
          <div className="account-content">
            <p className="muted">
              Use fictional details only. Profile, addresses and preferences are
              stored on this browser without encryption. Sign in with your
              original demo login email after refresh to retrieve them, even
              after editing your contact email.
            </p>
            {storageFailed && (
              <p role="alert">
                Browser storage is unavailable. Changes apply for this visit
                only.
              </p>
            )}
            {children}
          </div>
        </div>
      </main>
      <StoreFooter />
    </>
  );
}
