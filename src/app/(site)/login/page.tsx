import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/login-form";
import { Card, PageHeader } from "@/components/ui";
import { getCurrentUser } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "تسجيل الدخول",
  description: "بوابة مدارس النخبة الأهلية لأولياء الأمور والمعلمين والإدارة: الحضور والدرجات والجدول والرسوم والرسائل.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);
  const { next } = await searchParams;

  return (
    <div className="mx-auto max-w-md px-4 py-10">
      <PageHeader title="تسجيل الدخول" lead="بوابة أولياء الأمور والمعلمين والإدارة." />
      <Card>
        <LoginForm next={next} />
      </Card>
    </div>
  );
}
