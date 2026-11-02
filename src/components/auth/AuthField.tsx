import type { InputHTMLAttributes } from "react";

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  name: string;
  error?: string;
}
export default function AuthField({ label, name, error, ...input }: Props) {
  const description =
    [input["aria-describedby"], error ? `auth-${name}-error` : undefined]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="form-field">
      <label htmlFor={`auth-${name}`}>{label}</label>
      <input
        {...input}
        name={name}
        id={`auth-${name}`}
        aria-invalid={!!error}
        aria-describedby={description}
      />
      {error && (
        <p id={`auth-${name}-error`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function PasswordField({
  label,
  name,
  error,
  visible,
  onToggle,
  ...input
}: Props & { visible: boolean; onToggle: () => void }) {
  return (
    <div className="password-field">
      <AuthField
        {...input}
        type={visible ? "text" : "password"}
        label={label}
        name={name}
        error={error}
      />
      <button
        className="password-toggle"
        type="button"
        aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`}
        aria-pressed={visible}
        aria-controls={`auth-${name}`}
        onClick={onToggle}
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
