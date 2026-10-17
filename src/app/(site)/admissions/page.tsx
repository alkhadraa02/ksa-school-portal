import type { Metadata } from "next";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { ACADEMIC_YEAR, STAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "القبول والتسجيل",
  description: "خطوات القبول في مدارس النخبة الأهلية: قدّم طلب الالتحاق إلكترونياً وتابع حالته برقم الطلب لجميع المراحل من رياض الأطفال حتى الثانوية.",
  alternates: { canonical: "/admissions" },
  openGraph: { title: "القبول والتسجيل", url: "/admissions" },
};

const STEPS = [
  { t: "قدّم الطلب", d: "املأ نموذج الالتحاق الإلكتروني ببيانات الطالب وولي الأمر." },
  { t: "احتفظ برقم الطلب", d: "ستحصل على رقم مرجعي تتابع به حالة الطلب في أي وقت." },
  { t: "مراجعة اللجنة", d: "تفرز لجنة القبول الطلب وقد تتواصل معك لتحديد موعد لقاء." },
  { t: "القرار والتسجيل", d: "نخبرك بالقرار ونستكمل إجراءات التسجيل والرسوم." },
];

export default function AdmissionsPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="القبول والتسجيل"
        lead={`باب التقديم مفتوح للعام الدراسي ${ACADEMIC_YEAR} لجميع المراحل.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/admissions/apply">تقديم طلب التحاق</LinkButton>
            <LinkButton href="/admissions/status" kind="secondary">متابعة حالة الطلب</LinkButton>
          </div>
        }
      />
      <h2 className="mb-3 text-xl font-bold">خطوات القبول</h2>
      <ol className="grid gap-4 md:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.t}>
            <Card className="h-full">
              <span className="text-2xl font-bold text-accent">{i + 1}</span>
              <h3 className="mt-1 font-bold">{s.t}</h3>
              <p className="mt-1 text-sm text-muted">{s.d}</p>
            </Card>
          </li>
        ))}
      </ol>
      <h2 className="mb-3 mt-10 text-xl font-bold">المراحل المتاحة</h2>
      <ul className="grid gap-4 md:grid-cols-2">
        {STAGES.map((s) => (
          <li key={s.key}>
            <Card className="h-full">
              <h3 className="font-bold">{s.label}</h3>
              <p className="text-sm text-muted">{s.ages}</p>
              <p className="mt-2 text-sm">{s.levels.join(" · ")}</p>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
