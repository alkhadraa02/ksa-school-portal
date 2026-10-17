import type { Metadata } from "next";
import { Card, PageHeader } from "@/components/ui";
import { SCHOOL_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "عن المدرسة",
  description: "تعرّف على رسالة مدارس النخبة الأهلية ورؤيتها وقيمها وكيف نبني بيئة تعليمية آمنة ومحفّزة لكل طالب.",
  alternates: { canonical: "/about" },
  openGraph: { title: `عن ${SCHOOL_NAME}`, url: "/about" },
};

const values = [
  { title: "الأمانة والانتماء", text: "نغرس القيم الإسلامية والهوية الوطنية في سلوك الطالب اليومي." },
  { title: "التميز الأكاديمي", text: "مناهج مطوّرة وتقييم مستمر وخطط علاجية وإثرائية لكل طالب." },
  { title: "الشراكة مع الأسرة", text: "تواصل شفاف عبر البوابة الإلكترونية: حضور ودرجات وواجبات ورسائل." },
  { title: "بيئة آمنة", text: "إشراف تربوي، ومرشد طلابي، وسياسات واضحة للسلامة والسلوك." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <PageHeader
        title="عن المدرسة"
        lead={`${SCHOOL_NAME} مدرسة أهلية في الرياض تخدم الطلاب من رياض الأطفال حتى الثانوية.`}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="text-lg font-bold text-brand">رسالتنا</h2>
          <p className="mt-2">
            تقديم تعليم نوعي يبني شخصية الطالب علمياً وخلقياً ومهارياً، في شراكة حقيقية مع أسرته، ليكون مواطناً مسؤولاً ومبدعاً.
          </p>
        </Card>
        <Card>
          <h2 className="text-lg font-bold text-brand">رؤيتنا</h2>
          <p className="mt-2">أن نكون الخيار الأول للأسر الباحثة عن مدرسة أهلية متوازنة بين الأصالة والتقنية.</p>
        </Card>
      </div>
      <h2 className="mt-10 text-2xl font-bold">قيمنا</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {values.map((v) => (
          <Card key={v.title}>
            <h3 className="font-bold">{v.title}</h3>
            <p className="mt-1 text-sm text-muted">{v.text}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
