const TZ = "Asia/Riyadh";
const LOCALE = "ar-SA-u-ca-gregory-nu-latn";

function toDate(value: Date | string) {
  return typeof value === "string" ? new Date(value) : value;
}

export function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(toDate(value));
}

export function formatDateTime(value: Date | string) {
  return new Intl.DateTimeFormat(LOCALE, {
    timeZone: TZ,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(toDate(value));
}

export function formatWeekday(value: Date | string) {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, weekday: "long" }).format(toDate(value));
}

/** YYYY-MM-DD in the Riyadh time zone. */
export function todayISO(now: Date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function isoDate(value: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(toDate(value));
}

/** Sunday-Thursday are school days (day index 0..4). */
export function isSchoolDay(iso: string) {
  const d = new Date(`${iso}T00:00:00Z`).getUTCDay();
  return d >= 0 && d <= 4;
}

export function dayIndex(iso: string) {
  return new Date(`${iso}T00:00:00Z`).getUTCDay();
}

export function addDaysISO(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function formatSar(amount: number) {
  return `${new Intl.NumberFormat("ar-SA-u-nu-latn").format(amount)} ر.س`;
}

export function formatNumber(n: number) {
  return new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 1 }).format(n);
}

export function ageFrom(birth: Date | string, now: Date = new Date()) {
  const b = toDate(birth);
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const m = now.getUTCMonth() - b.getUTCMonth();
  if (m < 0 || (m === 0 && now.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

/** Normalise Saudi mobile numbers to the 05XXXXXXXX form, or return null. */
export function normalizePhone(input: string) {
  const digits = input.replace(/[\s\-()]/g, "");
  const m = /^(?:\+966|00966|966|0)?(5\d{8})$/.exec(digits);
  return m ? `0${m[1]}` : null;
}
