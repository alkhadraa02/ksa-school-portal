import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Card, LinkButton, PageHeader } from "@/components/ui";
import { STAGES } from "@/lib/constants";
import { db } from "@/lib/db";
import { formatSar } from "@/lib/format";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stage = STAGES.find((s) => s.slug === slug);
  if (!stage) return { title: "المرحلة غير موجودة" };
  return {
    title: stage.label,
    description: `${stage.label} في مدارس النخبة الأهلية (${stage.ages}): ${stage.summary}`.slice(0, 158),
    alternates: { canonical: `/stages/${stage.slug}` },
    openGraph: { title: stage.label, url: `/stages/${stage.slug}` },
  };
}

export default async function StagePage({ params }: Props) {
  const { slug } = await params;
  const stage = STAGES.find((s) => s.slug === slug);
  if (!stage) notFound();

  const [plans, classes] = await Promise.all([
    db.feePlan.findMany({ where: { stage: stage.key }, orderBy: { amount: "asc" } }),
    db.classGroup.findMany({ where: { stage: stage.key }, orderBy: [{ level: "asc" }, { section: "asc" }] }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader title={stage.label} lead={`${stage.ages}. ${stage.summary}`} />
      <h2 className="text-xl font-bold">الصفوف الدراسية</h2>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {stage.levels.map((l, i) => {
          const sections = classes.filter((c) => c.level === i + 1).length;
          return (
            <li key={l}>
              <Card>
                <p className="font-medium">{l}</p>
                <p className="text-sm text-muted">{sections > 0 ? `${sections} شعب` : "يُفتح عند اكتمال العدد"}</p>
              </Card>
            </li>
          );
        })}
      </ul>

      <h2 className="mt-10 text-xl font-bold">الرسوم الدراسية</h2>
      {plans.length === 0 ? (
        <p className="mt-2 text-muted">تواصل مع قسم القبول لمعرفة الرسوم.</p>
      ) : (
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {plans.map((p) => (
            <li key={p.id}>
              <Card>
                <p className="font-bold">{p.name}</p>
                <p className="mt-1 text-2xl font-bold text-brand">{formatSar(p.amount)}</p>
                <p className="text-sm text-muted">
                  العام {p.year} · تقسيط على {p.installments} {p.installments === 1 ? "دفعة" : "دفعات"}
                </p>
                {p.description ? <p className="mt-2 text-sm">{p.description}</p> : null}
              </Card>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-8">
        <LinkButton href="/admissions/apply">قدّم طلب التحاق</LinkButton>
      </div>
    </div>
  );
}
