import { useEffect, useSyncExternalStore } from "react";
import HomePage from "./pages/HomePage";
import CataloguePage from "./pages/CataloguePage";
import CartPage from "./pages/CartPage";
import CheckoutPage from "./pages/CheckoutPage";
import ConfirmationPage from "./pages/ConfirmationPage";
import PurchasePage from "./pages/PurchasePage";
import AuthPage from "./pages/AuthPage";
import PasswordResetSuccessPage from "./pages/PasswordResetSuccessPage";
import AccountPage from "./pages/AccountPage";
import AddressesPage from "./pages/AddressesPage";
import SettingsPage from "./pages/SettingsPage";
import OrdersPage from "./pages/OrdersPage";
import OrderDetailsPage from "./pages/OrderDetailsPage";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import {
  getLocationSnapshot,
  isProtectedPath,
  navigate,
  subscribeLocation,
} from "./features/auth/navigation";
import "./App.css";

function App() {
  const url = useSyncExternalStore(
    subscribeLocation,
    getLocationSnapshot,
    getLocationSnapshot,
  );
  const path = url.split("?")[0];
  useEffect(() => {
    const followLink = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const anchor =
        event.target instanceof Element ? event.target.closest("a") : null;
      if (
        !anchor ||
        anchor.hasAttribute("download") ||
        (anchor.target && anchor.target !== "_self")
      )
        return;
      const target = new URL(anchor.href, location.href);
      if (
        target.origin !== location.origin ||
        !["http:", "https:"].includes(target.protocol)
      )
        return;
      if (
        target.hash &&
        target.pathname === location.pathname &&
        target.search === location.search
      )
        return;
      event.preventDefault();
      navigate(target.pathname + target.search + target.hash);
      requestAnimationFrame(() => {
        if (target.hash)
          document.getElementById(target.hash.slice(1))?.scrollIntoView();
        else window.scrollTo(0, 0);
      });
    };
    document.addEventListener("click", followLink);
    return () => {
      document.removeEventListener("click", followLink);
    };
  }, []);
  const account = isProtectedPath(path) ? (
    <ProtectedRoute path={path}>
      {path === "/account/orders" ? (
        <OrdersPage />
      ) : path.startsWith("/account/orders/") ? (
        <OrderDetailsPage key={path} orderId={path.split("/")[3]} />
      ) : path === "/account/addresses" ? (
        <AddressesPage />
      ) : path === "/account/settings" ? (
        <SettingsPage />
      ) : (
        <AccountPage key={path} edit={path === "/account/profile"} />
      )}
    </ProtectedRoute>
  ) : path === "/login" ? (
    <AuthPage key={url} mode="login" />
  ) : path === "/register" ? (
    <AuthPage key={url} mode="register" />
  ) : path === "/forgot-password" ? (
    <AuthPage key={url} mode="forgot" />
  ) : path === "/reset-password" ? (
    <AuthPage key={url} mode="reset" />
  ) : path === "/password-reset-success" ? (
    <PasswordResetSuccessPage />
  ) : null;
  const purchase =
    path === "/cart" ? (
      <PurchasePage title="Shopping cart">
        <CartPage />
      </PurchasePage>
    ) : path === "/checkout" ? (
      <PurchasePage title="Demo checkout">
        <CheckoutPage />
      </PurchasePage>
    ) : path === "/order-confirmation" ? (
      <PurchasePage title="Demo confirmation">
        <ConfirmationPage />
      </PurchasePage>
    ) : null;
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {account ??
        purchase ??
        (path === "/" ? <HomePage /> : <CataloguePage key={url} />)}
    </>
  );
}

export default App;
