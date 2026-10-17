import type { Metadata } from "next";
import { db } from "@/lib/db";
import { Badge, Card, EmptyState, Field, PageHeader, TableWrap, buttonClass, inputClass, td, th } from "@/components/ui";
import { Flash } from "@/components/flash";
import { createStudentAction, updateStudentAction } from "@/app/actions/admin";
import { first, type OneOrMany } from "@/lib/portal";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "الطلاب" };

const STATUS_LABELS: Record<string, string> = { ACTIVE: "منتظم", WITHDRAWN: "منسحب", GRADUATED: "متخرج" };

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, OneOrMany>>;
}) {
  const params = await searchParams;
  const classFilter = first(params.class);
  const [students, classes, parents] = await Promise.all([
    db.student.findMany({
      where: classFilter ? { classId: classFilter } : undefined,
      include: { class: true, parent: true },
      orderBy: [{ class: { stage: "asc" } }, { class: { level: "asc" } }, { name: "asc" }],
      take: 300,
    }),
    db.classGroup.findMany({ orderBy: [{ stage: "asc" }, { level: "asc" }, { section: "asc" }] }),
    db.user.findMany({ where: { role: "PARENT" }, orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="الطلاب" lead="تسجيل الطلاب وإسنادهم إلى الفصول وأولياء أمورهم." />
      <Flash params={params} />

      <Card className="mb-6">
        <h2 className="mb-3 text-lg font-bold">إضافة طالب</h2>
        <form action={createStudentAction} className="grid gap-4 md:grid-cols-3">
          <Field label="اسم الطالب" name="name">
            <input id="name" name="name" required className={inputClass} />
          </Field>
          <Field label="تاريخ الميلاد" name="birthDate">
            <input id="birthDate" name="birthDate" type="date" required dir="ltr" className={inputClass} />
          </Field>
          <Field label="الجنس" name="gender">
            <select id="gender" name="gender" required defaultValue="M" className={inputClass}>
              <option value="M">ذكر</option>
              <option value="F">أنثى</option>
            </select>
          </Field>
          <Field label="الفصل" name="classId">
            <select id="classId" name="classId" defaultValue="" className={inputClass}>
              <option value="">بدون فصل</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
          <Field label="ولي الأمر" name="parentId">
            <select id="parentId" name="parentId" defaultValue="" className={inputClass}>
              <option value="">غير محدد</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </Field>
          <div className="flex items-end">
            <button type="submit" className={buttonClass("primary")}>إضافة</button>
          </div>
        </form>
      </Card>

      <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
        <Field label="تصفية بالفصل" name="class">
          <select id="class" name="class" defaultValue={classFilter ?? ""} className={inputClass}>
            <option value="">كل الفصول</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <button type="submit" className={buttonClass("secondary")}>تطبيق</button>
      </form>

      {students.length === 0 ? (
        <EmptyState title="لا يوجد طلاب" hint="أضف طالباً من النموذج أعلاه." />
      ) : (
        <TableWrap>
          <caption className="sr-only">قائمة الطلاب</caption>
          <thead>
            <tr>
              <th scope="col" className={th}>الرقم</th>
              <th scope="col" className={th}>الطالب</th>
              <th scope="col" className={th}>ولي الأمر</th>
              <th scope="col" className={th}>الميلاد</th>
              <th scope="col" className={th}>الفصل والحالة</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td className={td} dir="ltr">{s.studentNo}</td>
                <td className={td}>
                  <span className="font-medium">{s.name}</span>
                  <span className="block text-xs text-muted">{s.gender === "M" ? "ذكر" : "أنثى"}</span>
                </td>
                <td className={td}>{s.parent?.name ?? "—"}</td>
                <td className={td}>{formatDate(s.birthDate)}</td>
                <td className={td}>
                  <form action={updateStudentAction} className="flex flex-wrap items-center gap-2">
                    <input type="hidden" name="id" value={s.id} />
                    <select name="classId" defaultValue={s.classId ?? ""} aria-label={`فصل ${s.name}`} className={`${inputClass} !w-auto`}>
                      <option value="">بدون فصل</option>
                      {classes.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                    <select name="status" defaultValue={s.status} aria-label={`حالة ${s.name}`} className={`${inputClass} !w-auto`}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v}</option>
                      ))}
                    </select>
                    <button type="submit" className={buttonClass("secondary")}>حفظ</button>
                    <Badge tone={s.status === "ACTIVE" ? "success" : "neutral"}>{STATUS_LABELS[s.status] ?? s.status}</Badge>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      )}
    </>
  );
}
