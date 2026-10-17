import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, EmptyState, Field, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { Flash } from "@/components/flash";
import { createClassAction } from "@/app/actions/admin";
import type { OneOrMany } from "@/lib/portal";
import { ACADEMIC_YEAR, STAGES, stageLabel } from "@/lib/constants";

export const metadata: Metadata = { title: "الفصول والشعب" };

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const classes = await db.classGroup.findMany({
    include: { _count: { select: { students: true, assignments: true } } },
    orderBy: [{ stage: "asc" }, { level: "asc" }, { section: "asc" }],
  });

  return (
    <>
      <PageHeader title="الفصول والشعب" lead="أنشئ الشعب لكل صف دراسي وتابع سعتها وعدد طلابها." />
      <Flash params={params} />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-bold">إضافة شعبة</h2>
        <form action={createClassAction} className="grid gap-4 md:grid-cols-5">
          <Field label="المرحلة" name="stage">
            <select id="stage" name="stage" required defaultValue="PRIMARY" className={inputClass}>
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </Field>
          <Field label="رقم الصف داخل المرحلة" name="level" hint="مثال: 1 للأول">
            <input id="level" name="level" type="number" min={1} max={6} defaultValue={1} required dir="ltr" className={inputClass} />
          </Field>
          <Field label="الشعبة" name="section">
            <input id="section" name="section" required maxLength={4} defaultValue="أ" className={inputClass} />
          </Field>
          <Field label="السعة" name="capacity">
            <input id="capacity" name="capacity" type="number" min={5} max={60} defaultValue={30} required dir="ltr" className={inputClass} />
          </Field>
          <Field label="العام الدراسي" name="year">
            <input id="year" name="year" required defaultValue={ACADEMIC_YEAR} dir="ltr" className={inputClass} />
          </Field>
          <div className="md:col-span-5">
            <button type="submit" className={buttonClass("primary")}>إضافة الشعبة</button>
          </div>
        </form>
      </Card>

      {classes.length === 0 ? (
        <EmptyState title="لا توجد فصول" />
      ) : (
        <TableWrap>
          <caption className="sr-only">الفصول والشعب</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>الفصل</th>
              <th scope="col" className={th}>المرحلة</th>
              <th scope="col" className={th}>العام</th>
              <th scope="col" className={th}>الطلاب / السعة</th>
              <th scope="col" className={th}>المواد المُسنَدة</th>
            </tr>
          </thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td className={`${td} font-medium`}>{c.name}</td>
                <td className={td}>{stageLabel(c.stage)}</td>
                <td className={td} dir="ltr">{c.year}</td>
                <td className={td}>
                  {c._count.students} / {c.capacity}
                  {c._count.students > c.capacity ? <span className="ms-2 text-xs text-danger">تجاوز السعة</span> : null}
                </td>
                <td className={td}>{c._count.assignments}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
