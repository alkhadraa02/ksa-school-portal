import type { Metadata } from "next";
import { ApplyForm } from "@/components/apply-form";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "تقديم طلب التحاق",
  description: "نموذج طلب الالتحاق الإلكتروني بمدارس النخبة الأهلية: أدخل بيانات الطالب وولي الأمر لتحصل على رقم طلب تتابع به الحالة.",
  alternates: { canonical: "/admissions/apply" },
  openGraph: { title: "تقديم طلب التحاق", url: "/admissions/apply" },
};

export default function ApplyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <PageHeader title="تقديم طلب التحاق" lead="يستغرق التقديم دقائق قليلة، وجميع الحقول المطلوبة مذكورة بوضوح." />
      <Card>
        <ApplyForm />
      </Card>
    </div>
  );
}
