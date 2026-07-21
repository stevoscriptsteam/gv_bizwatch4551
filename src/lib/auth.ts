const SESSION_COOKIE = "bizwatch_session";
const SESSION_DAYS = 14;

export function sessionCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds,
  };
}

export function getSessionCookieName() {
  return SESSION_COOKIE;
}

export function getSessionMaxAge() {
  return SESSION_DAYS * 24 * 60 * 60;
}

export async function hashToken(token: string): Promise<string> {
  const data = new TextEncoder().encode(token);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateId(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${prefix}-${hex}`;
}

export function generateOtp(): string {
  const num = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return num.toString().padStart(6, "0");
}

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function sessionExpiry(): string {
  const date = new Date();
  date.setDate(date.getDate() + SESSION_DAYS);
  return date.toISOString();
}

export function otpExpiry(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() + 10);
  return date.toISOString();
}
