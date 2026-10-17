import type { Metadata } from "next";
import { StatusForm } from "@/components/status-form";
import { Card, PageHeader } from "@/components/ui";

export const metadata: Metadata = {
  title: "متابعة حالة الطلب",
  description: "استعلم عن حالة طلب الالتحاق في مدارس النخبة الأهلية برقم الطلب ورقم الجوال المسجّل في الطلب.",
  alternates: { canonical: "/admissions/status" },
  openGraph: { title: "متابعة حالة الطلب", url: "/admissions/status" },
};

export default function StatusPage() {
  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <PageHeader title="متابعة حالة الطلب" lead="أدخل رقم الطلب ورقم الجوال الذي سجّلته عند التقديم." />
      <Card>
        <StatusForm />
      </Card>
    </div>
  );
}
