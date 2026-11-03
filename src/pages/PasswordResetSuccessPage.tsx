import AuthLayout from "../components/auth/AuthLayout";
import { safeReturnTo } from "../features/auth/navigation";

export default function PasswordResetSuccessPage() {
  const returnTo = safeReturnTo(
    new URLSearchParams(location.search).get("returnTo"),
  );
  return (
    <AuthLayout
      title="Demo password reset complete"
      subtitle="Your demonstration is complete."
    >
      <div className="auth-success" role="status">
        <span aria-hidden="true">✓</span>
        <p>No real password has been changed or saved.</p>
      </div>
      <a
        className="primary-button auth-continue"
        href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
      >
        Back to sign in
      </a>
    </AuthLayout>
  );
}
