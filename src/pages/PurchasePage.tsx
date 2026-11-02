import { useEffect, useSyncExternalStore, type ReactNode } from "react";
import StoreHeader from "../components/StoreHeader";
import StoreFooter from "../components/StoreFooter";
import {
  getCartPersistenceSnapshot,
  getServerPersistenceSnapshot,
  subscribeCartPersistence,
} from "../app/store";

export default function PurchasePage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const storageFailed = useSyncExternalStore(
    subscribeCartPersistence,
    getCartPersistenceSnapshot,
    getServerPersistenceSnapshot,
  );
  useEffect(() => {
    document.title = `${title} | Cadna Mart`;
    document.getElementById("main-content")?.focus();
  }, [title]);
  return (
    <>
      <StoreHeader />
      <main
        id="main-content"
        tabIndex={-1}
        className="catalogue-main purchase-main container"
      >
        <nav className="breadcrumbs" aria-label="Breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <a href="/cart">Cart</a>
          <span>/</span>
          <span aria-current="page">{title}</span>
        </nav>
        {storageFailed && (
          <p role="alert" className="demo-notice">
            Browser storage is unavailable. Your cart will only last for this
            visit.
          </p>
        )}
        {children}
      </main>
      <StoreFooter />
    </>
  );
}
