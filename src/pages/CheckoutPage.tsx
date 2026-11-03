import { useRef, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  submitCheckout,
  validateCheckout,
  type CheckoutErrors,
  type CustomerInfo,
} from "../features/checkout/slice";
import OrderSummary from "../components/cart/OrderSummary";
import { selectCustomer, selectCustomerId } from "../features/auth/slice";

export default function CheckoutPage() {
  const customerId = useAppSelector(selectCustomerId);
  const profile = useAppSelector(selectCustomer);
  return (
    <CheckoutForm
      key={`${customerId ?? "guest"}:${profile?.fullName}:${profile?.email}:${profile?.phone}`}
    />
  );
}

const fields: {
  name: keyof CustomerInfo;
  label: string;
  autoComplete: string;
  type?: string;
}[] = [
  { name: "fullName", label: "Full name", autoComplete: "name" },
  {
    name: "email",
    label: "Email address",
    type: "email",
    autoComplete: "email",
  },
  { name: "phone", label: "Phone number", type: "tel", autoComplete: "tel" },
  {
    name: "address",
    label: "Delivery address",
    autoComplete: "street-address",
  },
  { name: "city", label: "City", autoComplete: "address-level2" },
  { name: "state", label: "State", autoComplete: "address-level1" },
];
function CheckoutForm() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const checkout = useAppSelector((state) => state.checkout);
  const profile = useAppSelector(selectCustomer);
  const account = useAppSelector((state) => state.account);
  const addresses = profile ? (account?.addresses ?? []) : [];
  const defaultAddress = addresses.find(
    (item) => item.id === account?.defaultId,
  );
  const [selectedId, setSelectedId] = useState(defaultAddress?.id ?? "");
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: profile?.fullName ?? "",
    email: profile?.email ?? "",
    phone: profile?.phone ?? "",
    address: defaultAddress?.address ?? "",
    city: defaultAddress?.city ?? "",
    state: defaultAddress?.state ?? "",
    instructions: "",
  });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const locked = useRef(false);
  const submitting = checkout.status === "submitting";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const next = validateCheckout(customer);
    setErrors(next);
    const first = fields.find((field) => next[field.name]);
    if (first) {
      document.getElementById(first.name)?.focus();
      return;
    }
    locked.current = true;
    try {
      const result = await dispatch(submitCheckout(customer));
      if (submitCheckout.fulfilled.match(result)) {
        history.pushState(null, "", "/order-confirmation");
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    } finally {
      locked.current = false;
    }
  }
  return (
    <>
      <h1>Demo checkout</h1>
      <p className="demo-notice">
        This is a demonstration. No live order is placed and no payment is
        taken. Product snapshots are saved locally; order history uses fictional
        delivery details and never saves the contact or address fields entered
        below. Use sample information only.
      </p>
      {cart.items.length || submitting ? (
        <div className="purchase-layout">
          <form
            className="checkout-form"
            noValidate
            onSubmit={submit}
            aria-busy={submitting}
          >
            <fieldset disabled={submitting}>
              <legend>Customer & delivery information</legend>
              {profile && (
                <div className="form-field">
                  <label htmlFor="saved-address">Saved delivery address</label>
                  <select
                    id="saved-address"
                    value={selectedId}
                    onChange={(event) => {
                      const id = event.target.value;
                      setSelectedId(id);
                      const item = addresses.find(
                        (address) => address.id === id,
                      );
                      setCustomer({
                        ...customer,
                        address: item?.address ?? "",
                        city: item?.city ?? "",
                        state: item?.state ?? "",
                      });
                      setErrors({});
                    }}
                  >
                    <option value="">Enter a new address</option>
                    {addresses.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                        {item.id === account?.defaultId ? " (default)" : ""}
                      </option>
                    ))}
                  </select>
                  <a href="/account/addresses">Manage saved addresses</a>
                </div>
              )}
              {fields.map((field) => (
                <div className="form-field" key={field.name}>
                  <label htmlFor={field.name}>
                    {field.label} <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type ?? "text"}
                    autoComplete={field.autoComplete}
                    required
                    maxLength={field.name === "address" ? 300 : 150}
                    value={customer[field.name]}
                    aria-invalid={!!errors[field.name]}
                    aria-describedby={
                      errors[field.name] ? `${field.name}-error` : undefined
                    }
                    onChange={(event) => {
                      if (["address", "city", "state"].includes(field.name))
                        setSelectedId("");
                      setCustomer({
                        ...customer,
                        [field.name]: event.target.value,
                      });
                    }}
                  />
                  {errors[field.name] && (
                    <p className="field-error" id={`${field.name}-error`}>
                      {errors[field.name]}
                    </p>
                  )}
                </div>
              ))}
              <div className="form-field">
                <label htmlFor="instructions">
                  Delivery instructions (optional)
                </label>
                <textarea
                  id="instructions"
                  maxLength={1000}
                  value={customer.instructions}
                  onChange={(event) =>
                    setCustomer({
                      ...customer,
                      instructions: event.target.value,
                    })
                  }
                />
              </div>
            </fieldset>
            {checkout.status === "error" && (
              <p role="alert" className="field-error">
                {checkout.error} Your cart has been preserved. Please try again.
              </p>
            )}
            <button className="primary-button" disabled={submitting}>
              {submitting ? "Submitting demo order…" : "Submit demo order"}
            </button>
            <p role="status">
              {submitting &&
                "Please wait while we prepare your demo confirmation."}
            </p>
            {!submitting && <a href="/cart">Return to cart</a>}
          </form>
          <OrderSummary cart={cart} />
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your cart is empty</h2>
          <p>Add products before checking out.</p>
          <a className="primary-button checkout-link" href="/catalogue">
            Continue shopping
          </a>
        </div>
      )}
    </>
  );
}
