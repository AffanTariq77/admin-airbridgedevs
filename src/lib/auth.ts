// WARNING: hardcoded admin credentials, checked in the browser.
// Anyone who opens the built JavaScript can read these and sign in. The blog
// tables are open to anonymous writes to match (see
// supabase/blog-open-write-policies.sql), so this login is convenience only,
// not a security boundary. Replace with Supabase Auth before this matters.
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";

const TOKEN_KEY = "admin_airbridge_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export function signIn(email: string, password: string) {
  const matches =
    email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD;

  if (!matches) {
    throw new Error("Invalid credentials");
  }

  setToken(btoa(`${email}:${Date.now()}`));
}

export function signOut() {
  clearToken();
}

export function isSignedIn() {
  return Boolean(getToken());
}
