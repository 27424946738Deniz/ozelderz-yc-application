export const AUTH_USERNAME = "YCfall";
export const AUTH_PASSWORD = "ycfall2026";
export const SESSION_COOKIE_NAME = "ozelderz_auth";
export const SESSION_TOKEN = "ozelderz-yc-showcase-authenticated";

export function isValidCredentials(username: string, password: string): boolean {
  return username === AUTH_USERNAME && password === AUTH_PASSWORD;
}

export function isAuthenticated(sessionValue: string | undefined): boolean {
  return sessionValue === SESSION_TOKEN;
}

export const ADMIN_PANEL_URL = "https://panel.ozelderz.com/admin/giris";
