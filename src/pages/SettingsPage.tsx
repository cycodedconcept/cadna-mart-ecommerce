import { useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import AccountLayout from "../components/account/AccountLayout";
import { PasswordField } from "../components/auth/AuthField";
import { emptyAccount, savePreferences } from "../features/account/slice";
import { validateReset } from "../features/auth/validation";

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const current = useAppSelector(
    (state) => state.account?.preferences ?? emptyAccount().preferences,
  );
  const [preferences, setPreferences] = useState(current);
  const [saved, setSaved] = useState(false);
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    password: "",
    confirmPassword: "",
  });
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const errors = validateReset(passwords);
  function save(event: FormEvent) {
    event.preventDefault();
    dispatch(savePreferences(preferences));
    setSaved(true);
  }
  return (
    <AccountLayout title="Account settings" section="settings">
      <section className="profile-panel">
        <h2>Communication preferences</h2>
        <p>Demo preferences only. No messages are sent.</p>
        <form className="auth-form" onSubmit={save}>
          {(
            [
              ["orderUpdates", "Order updates"],
              ["promotions", "Offers and promotions"],
            ] as const
          ).map(([name, label]) => (
            <label className="preference-control" key={name}>
              <input
                type="checkbox"
                checked={preferences[name]}
                onChange={(event) => {
                  setSaved(false);
                  setPreferences({
                    ...preferences,
                    [name]: event.target.checked,
                  });
                }}
              />
              {label}
            </label>
          ))}
          <div className="account-actions">
            <button className="primary-button">Save preferences</button>
            <button
              type="button"
              onClick={() => {
                setPreferences(current);
                setSaved(false);
              }}
            >
              Cancel
            </button>
          </div>
          <p role="status">
            {saved
              ? "Preferences updated. Browser storage availability is shown above."
              : ""}
          </p>
        </form>
      </section>
      <section className="profile-panel">
        <h2>Change password</h2>
        <p id="password-unavailable">
          Password changes are unavailable until a secure authentication service
          is connected. This preview validates input locally; no password is
          sent, saved or changed.
        </p>
        <div
          className="auth-form"
          role="group"
          aria-describedby="password-unavailable"
        >
          {(
            [
              ["currentPassword", "Current password"],
              ["password", "New password"],
              ["confirmPassword", "Confirm new password"],
            ] as const
          ).map(([name, label]) => (
            <PasswordField
              key={name}
              label={label}
              name={name}
              maxLength={128}
              autoComplete={
                name === "currentPassword" ? "current-password" : "new-password"
              }
              value={passwords[name]}
              visible={!!visible[name]}
              onToggle={() =>
                setVisible({ ...visible, [name]: !visible[name] })
              }
              error={
                passwords[name] && name !== "currentPassword"
                  ? errors[name]
                  : undefined
              }
              onChange={(event) =>
                setPasswords({ ...passwords, [name]: event.target.value })
              }
            />
          ))}
          <p>
            Use 8–128 characters with a letter, number and symbol, and no
            spaces. Confirmation must match.
          </p>
          <button
            className="primary-button"
            disabled
            aria-describedby="password-unavailable"
          >
            Change password (unavailable)
          </button>
          <button
            type="button"
            onClick={() => {
              setPasswords({
                currentPassword: "",
                password: "",
                confirmPassword: "",
              });
              setVisible({});
            }}
          >
            Clear password fields
          </button>
        </div>
      </section>
    </AccountLayout>
  );
}
