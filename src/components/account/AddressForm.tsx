import { useState, type FormEvent } from "react";
import AuthField from "../auth/AuthField";
import {
  validateAddress,
  type SavedAddress,
} from "../../features/account/slice";

export default function AddressForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: SavedAddress;
  onSave: (value: SavedAddress) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(initial);
  const [errors, setErrors] = useState<ReturnType<typeof validateAddress>>({});
  function submit(event: FormEvent) {
    event.preventDefault();
    const next = validateAddress(value);
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`auth-${first}`)?.focus();
      return;
    }
    onSave(value);
  }
  return (
    <form className="auth-form profile-panel" noValidate onSubmit={submit}>
      <h2>{initial.id ? "Edit address" : "Add new address"}</h2>
      {(
        [
          ["label", "Address label", "off", 50],
          ["address", "Street address", "street-address", 300],
          ["city", "City", "address-level2", 100],
          ["state", "State", "address-level1", 100],
        ] as const
      ).map(([name, label, autoComplete, maxLength]) => (
        <AuthField
          key={name}
          name={name}
          label={label}
          required
          autoFocus={name === "label"}
          autoComplete={autoComplete}
          maxLength={maxLength}
          value={value[name]}
          error={errors[name]}
          onChange={(event) =>
            setValue({ ...value, [name]: event.target.value })
          }
        />
      ))}
      <div className="account-actions">
        <button className="primary-button">Save address</button>
        <button type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
