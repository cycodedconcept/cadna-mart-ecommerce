const protectedPaths = [
  "/account",
  "/account/profile",
  "/account/orders",
  "/account/addresses",
  "/account/settings",
];
export const isProtectedPath = (path: string) =>
  protectedPaths.includes(path) ||
  /^\/account\/orders\/[A-Za-z0-9-]{1,100}$/.test(path);
export function safeReturnTo(value: string | null): string {
  return value && isProtectedPath(value) ? value : "/account";
}
export const loginDestination = (path: string) =>
  `/login?returnTo=${encodeURIComponent(safeReturnTo(path))}`;
export function navigate(path: string, replace = false) {
  if (replace) history.replaceState(null, "", path);
  else history.pushState(null, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
}
