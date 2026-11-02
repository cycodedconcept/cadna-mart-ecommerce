// Stable across demo logins, without putting the email itself in order storage.
// This derivation and client-side isolation are not authentication or authorization.
export async function demoCustomerId(email: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(email.trim().toLowerCase()),
  );
  return `demo-${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}
