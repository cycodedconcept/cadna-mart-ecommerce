import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import AccountLayout from "../components/account/AccountLayout";
import OrderDashboard from "../components/orders/OrderDashboard";
import AuthField from "../components/auth/AuthField";
import { selectCustomer, updateDemoProfile } from "../features/auth/slice";
import { validateProfile, type FormErrors } from "../features/auth/validation";
import type { CustomerProfile } from "../features/auth/types";

function ProfileForm({ profile }: { profile: CustomerProfile }) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [values, setValues] = useState(profile);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saved, setSaved] = useState(false);
  const [attempted, setAttempted] = useState(false);
  const locked = useRef(false);
  const active = useRef(true);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  const busy = auth.status === "loading";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || busy) return;
    const next = validateProfile(values);
    setErrors(next);
    setSaved(false);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`auth-${first}`)?.focus();
      return;
    }
    locked.current = true;
    setAttempted(true);
    try {
      const result = await dispatch(updateDemoProfile(values));
      if (active.current) setSaved(result === "success");
    } finally {
      locked.current = false;
    }
  }
  return (
    <section className="profile-panel">
      <h2>Edit profile</h2>
      <form className="auth-form" noValidate onSubmit={submit} aria-busy={busy}>
        <fieldset disabled={busy}>
          <legend className="visually-hidden">Customer profile</legend>
          <AuthField
            label="Full name"
            name="fullName"
            autoComplete="name"
            required
            maxLength={100}
            value={values.fullName}
            error={errors.fullName}
            onChange={(event) => {
              setSaved(false);
              setValues({ ...values, fullName: event.target.value });
            }}
          />
          <AuthField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            value={values.email}
            error={errors.email}
            onChange={(event) => {
              setSaved(false);
              setValues({ ...values, email: event.target.value });
            }}
          />
          <AuthField
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            maxLength={30}
            value={values.phone}
            error={errors.phone}
            onChange={(event) => {
              setSaved(false);
              setValues({ ...values, phone: event.target.value });
            }}
          />
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Saving demo profile…" : "Save changes"}
          </button>
        </fieldset>
        {attempted &&
          auth.operation === "profile" &&
          auth.status === "error" && (
            <p role="alert" className="field-error">
              {auth.error} Your previous profile is unchanged.
            </p>
          )}
        <p role="status">
          {saved
            ? "Demo profile updated. Browser storage availability is shown above."
            : busy
              ? "Saving changes…"
              : ""}
        </p>
        {!busy && (
          <a className="auth-continue" href="/account">
            Cancel
          </a>
        )}
      </form>
      <p className="muted">
        For a simulated save failure, use fail@example.com. Changes are kept
        locally in this browser when storage is available. Use fictional details
        only.
      </p>
    </section>
  );
}
export default function AccountPage({ edit = false }: { edit?: boolean }) {
  const profile = useAppSelector(selectCustomer);
  if (!profile) return null;
  return (
    <AccountLayout
      title={edit ? "Edit profile" : "My account"}
      section={edit ? "profile" : "overview"}
    >
      {edit ? (
        <ProfileForm profile={profile} />
      ) : (
        <>
          <section className="profile-panel">
            <p className="eyebrow">YOUR DEMO ACCOUNT</p>
            <h2>Welcome, {profile.fullName}</h2>
            <dl className="profile-summary">
              <div>
                <dt>Full name</dt>
                <dd>{profile.fullName}</dd>
              </div>
              <div>
                <dt>Email address</dt>
                <dd>{profile.email}</dd>
              </div>
              <div>
                <dt>Phone number</dt>
                <dd>{profile.phone || "Not provided"}</dd>
              </div>
            </dl>
            <a className="primary-button checkout-link" href="/account/profile">
              Edit profile
            </a>
            <p className="muted">
              No real customer account has been created. Your shopping cart is
              retained when you log out.
            </p>
          </section>
          <OrderDashboard />
        </>
      )}
    </AccountLayout>
  );
}
