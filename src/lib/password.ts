import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

const KEY_LEN = 64;

/** scrypt with a random per-password salt. Format: scrypt$<salt hex>$<hash hex> */
export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, KEY_LEN);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string) {
  const [alg, saltHex, hashHex] = stored.split("$");
  if (alg !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function newSessionToken() {
  return randomBytes(32).toString("hex");
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** A hash of a throw-away password so failed logins cost the same time whether or not the email exists. */
export const DUMMY_HASH = hashPassword(randomBytes(8).toString("hex"));
