import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parentChildren } from "@/lib/portal";
import { INVOICE_LABELS, balance, invoiceStatus, paidTotal, type InvoiceStatus } from "@/lib/fees";
import { Badge, Card, EmptyState, PageHeader, Stat, TableWrap, td, th } from "@/components/ui";
import { formatDate, formatSar } from "@/lib/format";
import { PAYMENT_LABELS } from "@/lib/constants";

export const metadata: Metadata = { title: "الرسوم والفواتير" };

const TONE: Record<InvoiceStatus, "success" | "info" | "warning" | "danger"> = {
  PAID: "success",
  PARTIAL: "info",
  UNPAID: "warning",
  OVERDUE: "danger",
};

export default async function ParentFees() {
  const user = await requireRole("PARENT");
  const kids = await parentChildren(user.id);
  const invoices = await db.invoice.findMany({
    where: { studentId: { in: kids.map((k) => k.id) } },
    include: { payments: { orderBy: { receivedAt: "desc" } }, student: true },
    orderBy: { dueDate: "asc" },
  });

  const total = invoices.reduce((s, i) => s + i.amount, 0);
  const paid = invoices.reduce((s, i) => s + paidTotal(i.payments), 0);
  const due = invoices.reduce((s, i) => s + balance(i), 0);

  return (
    <>
      <PageHeader title="الرسوم والفواتير" lead="الفواتير الدراسية وسجل المدفوعات." />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Stat label="إجمالي الفواتير" value={formatSar(total)} />
        <Stat label="المسدد" value={formatSar(paid)} />
        <Stat label="المتبقي" value={formatSar(due)} />
      </div>
      {invoices.length === 0 ? (
        <EmptyState title="لا توجد فواتير" />
      ) : (
        <>
          <TableWrap>
            <caption className="sr-only">الفواتير</caption>
            <thead>
              <tr>
                <th scope="col" className={th}>رقم الفاتورة</th>
                <th scope="col" className={th}>الطالب</th>
                <th scope="col" className={th}>البيان</th>
                <th scope="col" className={th}>الاستحقاق</th>
                <th scope="col" className={th}>المبلغ</th>
                <th scope="col" className={th}>المتبقي</th>
                <th scope="col" className={th}>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => {
                const st = invoiceStatus(i);
                return (
                  <tr key={i.id}>
                    <td className={td}><span dir="ltr">{i.number}</span></td>
                    <td className={td}>{i.student.name.split(" ")[0]}</td>
                    <td className={td}>{i.title}</td>
                    <td className={td}>{formatDate(i.dueDate)}</td>
                    <td className={td}>{formatSar(i.amount)}</td>
                    <td className={td}>{formatSar(balance(i))}</td>
                    <td className={td}><Badge tone={TONE[st]}>{INVOICE_LABELS[st]}</Badge></td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <h2 className="mb-3 mt-8 text-xl font-bold">سجل المدفوعات</h2>
          {invoices.every((i) => i.payments.length === 0) ? (
            <EmptyState title="لا توجد مدفوعات مسجلة" />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {invoices.flatMap((i) =>
                i.payments.map((p) => (
                  <li key={p.id}>
                    <Card>
                      <p className="font-bold">{formatSar(p.amount)}</p>
                      <p className="text-sm text-muted">
                        {i.title} · {PAYMENT_LABELS[p.method] ?? p.method} · {formatDate(p.receivedAt)}
                      </p>
                    </Card>
                  </li>
                )),
              )}
            </ul>
          )}
          <p className="mt-6 text-sm text-muted">يتم تسجيل المدفوعات من قسم الحسابات بعد السداد في المدرسة أو بالحوالة البنكية.</p>
        </>
      )}
    </>
  );
}
