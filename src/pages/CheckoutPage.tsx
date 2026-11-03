import { useRef, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  submitCheckout,
  validateCheckout,
  type CheckoutErrors,
  type CustomerInfo,
} from "../features/checkout/slice";
import OrderSummary from "../components/cart/OrderSummary";

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
export default function CheckoutPage() {
  const dispatch = useAppDispatch();
  const cart = useAppSelector((state) => state.cart);
  const checkout = useAppSelector((state) => state.checkout);
  const [customer, setCustomer] = useState<CustomerInfo>({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
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
                    onChange={(event) =>
                      setCustomer({
                        ...customer,
                        [field.name]: event.target.value,
                      })
                    }
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
