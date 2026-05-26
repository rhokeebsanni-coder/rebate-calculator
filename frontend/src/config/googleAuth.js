export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() || "";

export const isGoogleAuthConfigured = () =>
  Boolean(GOOGLE_CLIENT_ID) &&
  !GOOGLE_CLIENT_ID.includes("your_google_client_id") &&
  GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com");
