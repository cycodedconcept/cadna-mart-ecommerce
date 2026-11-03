import { useEffect, type ReactNode } from "react";

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  useEffect(() => {
    document.title = `${title} | Cadna Mart`;
    document.getElementById("main-content")?.focus();
  }, [title]);
  return (
    <main id="main-content" tabIndex={-1} className="auth-main">
      <a className="auth-brand" href="/" aria-label="Cadna Mart home">
        <img src="/images/logo.png" alt="Cadna Mart" />
      </a>
      <header className="auth-heading">
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </header>
      <div className="auth-content">
        <p className="auth-demo-note">
          Frontend demo only. No real account, authentication or emails. Use
          sample details and a password you do not use elsewhere. Refresh ends
          your demo session.
        </p>
        {children}
      </div>
    </main>
  );
}
