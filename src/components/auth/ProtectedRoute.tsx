import { useEffect, type ReactNode } from "react";
import { useAppSelector } from "../../app/hooks";
import { selectIsAuthenticated } from "../../features/auth/slice";
import { loginDestination, navigate } from "../../features/auth/navigation";
import AuthLayout from "./AuthLayout";

export default function ProtectedRoute({
  path,
  children,
}: {
  path: string;
  children: ReactNode;
}) {
  const authenticated = useAppSelector(selectIsAuthenticated);
  const destination = loginDestination(path);
  useEffect(() => {
    if (!authenticated) navigate(destination, true);
  }, [authenticated, destination]);
  if (!authenticated)
    return (
      <AuthLayout
        title="Sign in to your account"
        subtitle="Your requested page will open after demo sign-in."
      >
        <p role="status">Redirecting to demo login…</p>
        <a href={destination}>Continue to login</a>
      </AuthLayout>
    );
  return children;
}
