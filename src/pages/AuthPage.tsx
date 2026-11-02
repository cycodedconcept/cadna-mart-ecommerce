import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppDispatch, useAppSelector } from "../app/hooks";
import AuthLayout from "../components/auth/AuthLayout";
import AuthField, { PasswordField } from "../components/auth/AuthField";
import {
  forgotPasswordDemo,
  loginDemo,
  registerDemo,
  resetPasswordDemo,
} from "../features/auth/slice";
import { navigate, safeReturnTo } from "../features/auth/navigation";
import {
  passwordRules,
  validateEmail,
  validateLogin,
  validateRegistration,
  validateReset,
  type FormErrors,
} from "../features/auth/validation";
import type { RegistrationInput } from "../features/auth/types";

type Mode = "login" | "register" | "forgot" | "reset";
const copy: Record<Mode, { title: string; subtitle: string; button: string }> =
  {
    login: {
      title: "Welcome back to Cadna Mart",
      subtitle: "Sign in to your demo account.",
      button: "Sign in to demo",
    },
    register: {
      title: "Set up your account",
      subtitle: "Fill in your details to try demo registration.",
      button: "Create demo account",
    },
    forgot: {
      title: "Forgot password?",
      subtitle: "Enter your email to try the password recovery flow.",
      button: "Continue",
    },
    reset: {
      title: "Set your password",
      subtitle: "Try a new password in this demonstration.",
      button: "Confirm demo reset",
    },
  };
export default function AuthPage({ mode }: { mode: Mode }) {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const [values, setValues] = useState<RegistrationInput>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [visible, setVisible] = useState({
    password: false,
    confirmPassword: false,
  });
  const [success, setSuccess] = useState(false);
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
  const returnTo = safeReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
  );
  const suffix = `?returnTo=${encodeURIComponent(returnTo)}`;
  const update = (name: keyof RegistrationInput, value: string) =>
    setValues((current) => ({ ...current, [name]: value }));
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current || busy) return;
    const emailError = validateEmail(values.email);
    const next =
      mode === "register"
        ? validateRegistration(values)
        : mode === "login"
          ? validateLogin(values)
          : mode === "reset"
            ? validateReset(values)
            : emailError
              ? { email: emailError }
              : {};
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`auth-${first}`)?.focus();
      return;
    }
    locked.current = true;
    setAttempted(true);
    try {
      const result = await dispatch(
        mode === "login"
          ? loginDemo({ email: values.email, password: values.password })
          : mode === "register"
            ? registerDemo(values)
            : mode === "forgot"
              ? forgotPasswordDemo(values.email)
              : resetPasswordDemo({
                  password: values.password,
                  confirmPassword: values.confirmPassword,
                }),
      );
      if (!active.current) return;
      setValues((current) => ({
        ...current,
        password: "",
        confirmPassword: "",
      }));
      if (result !== "success") return;
      if (mode === "login") navigate(returnTo, true);
      else if (mode === "reset")
        navigate(`/password-reset-success${suffix}`, true);
      else setSuccess(true);
    } finally {
      locked.current = false;
    }
  }
  if (success)
    return (
      <AuthLayout
        title={
          mode === "register"
            ? "Demo registration complete"
            : "Demo recovery request complete"
        }
        subtitle={
          mode === "register"
            ? "No credentials were saved. You can now try demo sign-in."
            : "No email was sent. Continue directly to the demo reset screen."
        }
      >
        <div className="auth-success" role="status">
          <span aria-hidden="true">✓</span>
          <p>
            {mode === "register"
              ? "This has not created a live customer account."
              : "This demonstration does not look up accounts or generate reset tokens."}
          </p>
        </div>
        {mode === "forgot" && (
          <a
            className="primary-button auth-continue"
            href={`/reset-password${suffix}`}
          >
            Try demo password reset
          </a>
        )}
        <a className="auth-continue" href={`/login${suffix}`}>
          Back to sign in
        </a>
      </AuthLayout>
    );
  return (
    <AuthLayout title={copy[mode].title} subtitle={copy[mode].subtitle}>
      <form className="auth-form" noValidate aria-busy={busy} onSubmit={submit}>
        <fieldset disabled={busy}>
          <legend className="visually-hidden">{copy[mode].title}</legend>
          {mode === "register" && (
            <AuthField
              label="Full name"
              name="fullName"
              autoComplete="name"
              required
              maxLength={100}
              value={values.fullName}
              error={errors.fullName}
              onChange={(event) => update("fullName", event.target.value)}
            />
          )}
          {mode !== "reset" && (
            <AuthField
              label="Email address"
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={values.email}
              error={errors.email}
              onChange={(event) => update("email", event.target.value)}
            />
          )}
          {mode === "register" && (
            <AuthField
              label="Phone number"
              name="phone"
              type="tel"
              autoComplete="tel"
              required
              maxLength={30}
              value={values.phone}
              error={errors.phone}
              onChange={(event) => update("phone", event.target.value)}
            />
          )}
          {mode !== "forgot" && (
            <PasswordField
              label={mode === "reset" ? "New password" : "Password"}
              name="password"
              autoComplete={
                mode === "login" ? "current-password" : "new-password"
              }
              required
              maxLength={128}
              value={values.password}
              error={errors.password}
              visible={visible.password}
              aria-describedby={
                mode !== "login" ? "password-requirements" : undefined
              }
              onToggle={() =>
                setVisible((current) => ({
                  ...current,
                  password: !current.password,
                }))
              }
              onChange={(event) => update("password", event.target.value)}
            />
          )}
          {(mode === "register" || mode === "reset") && (
            <>
              <ul
                id="password-requirements"
                className="password-requirements"
                aria-label="Password requirements"
              >
                {passwordRules(
                  values.password,
                  mode === "register" ? values.fullName : "",
                  mode === "register" ? values.email : "",
                ).map((rule) => (
                  <li key={rule.label}>
                    <span
                      aria-hidden="true"
                      className={rule.valid ? "rule-pass" : ""}
                    >
                      {rule.valid ? "✓" : "○"}
                    </span>
                    <span className="visually-hidden">
                      {rule.valid ? "Met: " : "Not met: "}
                    </span>
                    {rule.label}
                  </li>
                ))}
              </ul>
              <PasswordField
                label="Confirm password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                maxLength={128}
                value={values.confirmPassword}
                error={errors.confirmPassword}
                visible={visible.confirmPassword}
                onToggle={() =>
                  setVisible((current) => ({
                    ...current,
                    confirmPassword: !current.confirmPassword,
                  }))
                }
                onChange={(event) =>
                  update("confirmPassword", event.target.value)
                }
              />
            </>
          )}
          {mode === "login" && (
            <a className="forgot-link" href={`/forgot-password${suffix}`}>
              Forgot password?
            </a>
          )}
          {attempted && auth.operation === mode && auth.status === "error" && (
            <p role="alert" className="field-error">
              {auth.error}
            </p>
          )}
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? "Please wait…" : copy[mode].button}
          </button>
          <p role="status">{busy && "Processing demo request…"}</p>
        </fieldset>
      </form>
      {mode === "login" && (
        <>
          <p className="demo-failure-hint">
            Any valid email and non-empty password can try the demo. Use
            fail@example.com to preview a failed login.
          </p>
          <p className="auth-switch">
            New to Cadna Mart? <a href={`/register${suffix}`}>Sign up</a>
          </p>
        </>
      )}
      {mode === "register" && (
        <p className="auth-switch">
          Already have an account? <a href={`/login${suffix}`}>Sign in</a>
        </p>
      )}
      {(mode === "forgot" || mode === "reset") && (
        <p className="auth-switch">
          <a href={`/login${suffix}`}>Back to sign in</a>
        </p>
      )}
      <a className="auth-store-link" href="/">
        Continue shopping
      </a>
    </AuthLayout>
  );
}
