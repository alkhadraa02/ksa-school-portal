export type InvoiceStatus = "PAID" | "PARTIAL" | "OVERDUE" | "UNPAID";

export const INVOICE_LABELS: Record<InvoiceStatus, string> = {
  PAID: "مسددة",
  PARTIAL: "مسددة جزئياً",
  OVERDUE: "متأخرة",
  UNPAID: "غير مسددة",
};

export function paidTotal(payments: { amount: number }[]) {
  return payments.reduce((s, p) => s + p.amount, 0);
}

export function balance(invoice: { amount: number; payments: { amount: number }[] }) {
  return Math.max(0, invoice.amount - paidTotal(invoice.payments));
}

export function invoiceStatus(
  invoice: { amount: number; dueDate: Date; payments: { amount: number }[] },
  now: Date = new Date(),
): InvoiceStatus {
  const paid = paidTotal(invoice.payments);
  if (paid >= invoice.amount) return "PAID";
  if (invoice.dueDate.getTime() < now.getTime()) return "OVERDUE";
  return paid > 0 ? "PARTIAL" : "UNPAID";
}

/** Split an amount into n whole-riyal instalments that always add back up to the total. */
export function splitInstallments(total: number, n: number) {
  const count = Math.max(1, Math.floor(n));
  const base = Math.floor(total / count);
  const remainder = total - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

export function invoiceNumber(year: number, seq: number) {
  return `INV-${year}-${String(seq).padStart(6, "0")}`;
}
