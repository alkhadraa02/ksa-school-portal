import { randomInt } from "node:crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alike characters

/** Public application reference, e.g. ADM-2026-K7P2QX. */
export function generateReference(year: number = new Date().getFullYear()) {
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  return `ADM-${year}-${code}`;
}
