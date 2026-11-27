export const publicAsset = (path: string) =>
  new URL(
    (import.meta.env.VITE_PUBLIC_BASE || "/") + path.replace(/^\//, ""),
    location.href,
  ).href;
