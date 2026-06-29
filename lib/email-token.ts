import { createHmac, timingSafeEqual } from "crypto";

/**
 * Stateless unsubscribe tokens: HMAC(email) so a footer link can opt an address
 * out without us storing a per-email secret, and without being guessable/enumerable.
 * Reuses CRON_SECRET as the signing key (already server-only). If CRON_SECRET is
 * unset the token is empty and verification fails closed.
 */
function key(): string {
  return process.env.CRON_SECRET ?? "";
}

export function signEmailToken(email: string): string {
  const k = key();
  if (!k) return "";
  return createHmac("sha256", k)
    .update(email.trim().toLowerCase())
    .digest("base64url");
}

export function verifyEmailToken(email: string, token: string): boolean {
  const expected = signEmailToken(email);
  if (!expected || !token) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}
