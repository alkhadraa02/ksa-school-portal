import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Card, EmptyState, Field, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { Flash } from "@/components/flash";
import { createSubjectAction } from "@/app/actions/admin";
import type { OneOrMany } from "@/lib/portal";

export const metadata: Metadata = { title: "المواد" };

export default async function SubjectsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const subjects = await db.subject.findMany({
    include: { _count: { select: { assignments: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <>
      <PageHeader title="المواد" lead="المواد الدراسية المتاحة للإسناد إلى المعلمين والفصول." />
      <Flash params={params} />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-bold">إضافة مادة</h2>
        <form action={createSubjectAction} className="grid gap-4 md:grid-cols-3">
          <Field label="اسم المادة" name="name">
            <input id="name" name="name" required className={inputClass} />
          </Field>
          <Field label="الرمز" name="code" hint="حروف لاتينية، مثال: MATH">
            <input id="code" name="code" required maxLength={12} dir="ltr" className={inputClass} />
          </Field>
          <div className="flex items-end">
            <button type="submit" className={buttonClass("primary")}>إضافة</button>
          </div>
        </form>
      </Card>

      {subjects.length === 0 ? (
        <EmptyState title="لا توجد مواد" />
      ) : (
        <TableWrap>
          <caption className="sr-only">المواد الدراسية</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>المادة</th>
              <th scope="col" className={th}>الرمز</th>
              <th scope="col" className={th}>عدد الفصول</th>
            </tr>
          </thead>
          <tbody>
            {subjects.map((s) => (
              <tr key={s.id}>
                <td className={`${td} font-medium`}>{s.name}</td>
                <td className={td} dir="ltr">{s.code}</td>
                <td className={td}>{s._count.assignments}</td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
