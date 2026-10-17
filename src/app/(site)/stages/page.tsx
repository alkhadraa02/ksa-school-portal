import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui";
import { STAGES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "المراحل الدراسية",
  description: "المراحل الدراسية في مدارس النخبة الأهلية: رياض الأطفال والابتدائية والمتوسطة والثانوية، مع الصفوف والأعمار لكل مرحلة.",
  alternates: { canonical: "/stages" },
  openGraph: { title: "المراحل الدراسية", url: "/stages" },
};

export default function StagesPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title="المراحل الدراسية" lead="أربع مراحل متكاملة تصحب الطالب من أول خطوة حتى التخرج." />
      <div className="grid gap-4 md:grid-cols-2">
        {STAGES.map((s) => (
          <Card key={s.key}>
            <h2 className="text-xl font-bold text-brand">{s.label}</h2>
            <p className="mt-1 text-sm text-muted">{s.ages}</p>
            <p className="mt-3">{s.summary}</p>
            <p className="mt-3 text-sm text-muted">{s.levels.length} صفوف دراسية</p>
            <Link href={`/stages/${s.slug}`} className="mt-3 inline-block font-medium text-brand underline">
              تفاصيل {s.label}
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
