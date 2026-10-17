import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Field, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { Flash } from "@/components/flash";
import { createFeePlanAction, generateInvoicesAction, recordPaymentAction } from "@/app/actions/admin";
import { first, type OneOrMany } from "@/lib/portal";
import { balance, invoiceStatus, INVOICE_LABELS, paidTotal } from "@/lib/fees";
import { formatDate, formatSar } from "@/lib/format";
import { ACADEMIC_YEAR, PAYMENT_LABELS, PAYMENT_METHODS, STAGES, stageLabel } from "@/lib/constants";

export const metadata: Metadata = { title: "الرسوم والفواتير" };

const TONES = { PAID: "success", PARTIAL: "info", OVERDUE: "danger", UNPAID: "warning" } as const;

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const only = first(params.filter);
  const [plans, invoices] = await Promise.all([
    db.feePlan.findMany({ include: { _count: { select: { invoices: true } } }, orderBy: [{ stage: "asc" }, { name: "asc" }] }),
    db.invoice.findMany({
      include: { student: true, payments: true },
      orderBy: { dueDate: "asc" },
      take: 400,
    }),
  ]);
  const rows = invoices
    .map((i) => ({ i, status: invoiceStatus(i), left: balance(i), paid: paidTotal(i.payments) }))
    .filter((r) => (only === "open" ? r.status !== "PAID" : only === "overdue" ? r.status === "OVERDUE" : true))
    .slice(0, 150);

  return (
    <>
      <PageHeader title="الرسوم والفواتير" lead="خطط الرسوم، وإصدار الفواتير على دفعات، وتسجيل المدفوعات يدوياً (لا توجد بوابة دفع إلكتروني)." />
      <Flash params={params} />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-bold">إضافة خطة رسوم</h2>
        <form action={createFeePlanAction} className="grid gap-4 md:grid-cols-3">
          <Field label="اسم الخطة" name="name">
            <input id="name" name="name" required className={inputClass} />
          </Field>
          <Field label="المرحلة" name="stage">
            <select id="stage" name="stage" required defaultValue="PRIMARY" className={inputClass}>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="المبلغ السنوي (ر.س)" name="amount">
            <input id="amount" name="amount" type="number" min={100} required dir="ltr" className={inputClass} />
          </Field>
          <Field label="عدد الدفعات" name="installments">
            <input id="installments" name="installments" type="number" min={1} max={12} defaultValue={3} required dir="ltr" className={inputClass} />
          </Field>
          <Field label="العام الدراسي" name="year">
            <input id="year" name="year" defaultValue={ACADEMIC_YEAR} required dir="ltr" className={inputClass} />
          </Field>
          <Field label="وصف (اختياري)" name="description">
            <input id="description" name="description" maxLength={300} className={inputClass} />
          </Field>
          <div className="md:col-span-3">
            <button type="submit" className={buttonClass("primary")}>إضافة الخطة</button>
          </div>
        </form>
      </Card>

      <h2 className="mb-3 text-xl font-bold">خطط الرسوم</h2>
      {plans.length === 0 ? (
        <EmptyState title="لا توجد خطط" />
      ) : (
        <TableWrap>
          <caption className="sr-only">خطط الرسوم</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>الخطة</th>
              <th scope="col" className={th}>المرحلة</th>
              <th scope="col" className={th}>المبلغ</th>
              <th scope="col" className={th}>الدفعات</th>
              <th scope="col" className={th}>الفواتير</th>
              <th scope="col" className={th}>إصدار</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.id}>
                <td className={`${td} font-medium`}>{p.name}</td>
                <td className={td}>{stageLabel(p.stage)}</td>
                <td className={td}>{formatSar(p.amount)}</td>
                <td className={td}>{p.installments}</td>
                <td className={td}>{p._count.invoices}</td>
                <td className={td}>
                  <form action={generateInvoicesAction}>
                    <input type="hidden" name="planId" value={p.id} />
                    <button type="submit" className={buttonClass("secondary")}>إصدار للطلاب</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}

      <h2 className="mb-3 mt-8 text-xl font-bold">الفواتير</h2>
      <nav aria-label="تصفية الفواتير" className="mb-3 flex flex-wrap gap-2">
        <a href="/admin/fees" className={buttonClass(!only ? "primary" : "secondary")}>الكل</a>
        <a href="/admin/fees?filter=open" className={buttonClass(only === "open" ? "primary" : "secondary")}>غير المسددة</a>
        <a href="/admin/fees?filter=overdue" className={buttonClass(only === "overdue" ? "primary" : "secondary")}>المتأخرة</a>
      </nav>
      {rows.length === 0 ? (
        <EmptyState title="لا توجد فواتير" hint="أصدر فواتير من إحدى الخطط أعلاه." />
      ) : (
        <TableWrap>
          <caption className="sr-only">الفواتير</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>الفاتورة</th>
              <th scope="col" className={th}>الطالب</th>
              <th scope="col" className={th}>الاستحقاق</th>
              <th scope="col" className={th}>المبلغ / المدفوع</th>
              <th scope="col" className={th}>الحالة</th>
              <th scope="col" className={th}>تسجيل دفعة</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ i, status, left, paid }) => (
              <tr key={i.id}>
                <td className={td}>
                  <span dir="ltr" className="block text-start">{i.number}</span>
                  <span className="text-xs text-muted">{i.title}</span>
                </td>
                <td className={td}>{i.student.name}</td>
                <td className={td}>{formatDate(i.dueDate)}</td>
                <td className={td}>{formatSar(i.amount)} / {formatSar(paid)}</td>
                <td className={td}><Badge tone={TONES[status]}>{INVOICE_LABELS[status]}</Badge></td>
                <td className={td}>
                  {left > 0 ? (
                    <form action={recordPaymentAction} className="flex flex-wrap items-center gap-2">
                      <input type="hidden" name="invoiceId" value={i.id} />
                      <input
                        name="amount"
                        type="number"
                        min={1}
                        max={left}
                        defaultValue={left}
                        required
                        dir="ltr"
                        aria-label={`مبلغ الدفعة للفاتورة ${i.number}`}
                        className={`${inputClass} !w-28`}
                      />
                      <select name="method" aria-label={`طريقة الدفع للفاتورة ${i.number}`} className={`${inputClass} !w-auto`}>
                        {PAYMENT_METHODS.map((m) => (
                          <option key={m} value={m}>{PAYMENT_LABELS[m]}</option>
                        ))}
                      </select>
                      <button type="submit" className={buttonClass("secondary")}>تسجيل</button>
                    </form>
                  ) : (
                    <span className="text-sm text-muted">لا شيء مستحق</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
