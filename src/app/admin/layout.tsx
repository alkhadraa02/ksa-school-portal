import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "لوحة الإدارة", template: "%s | لوحة الإدارة" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/admin", label: "نظرة عامة" },
  { href: "/admin/students", label: "الطلاب" },
  { href: "/admin/classes", label: "الفصول والشعب" },
  { href: "/admin/subjects", label: "المواد" },
  { href: "/admin/teachers", label: "المعلمون" },
  { href: "/admin/timetable", label: "الجدول الدراسي" },
  { href: "/admin/admissions", label: "طلبات القبول" },
  { href: "/admin/fees", label: "الرسوم والفواتير" },
  { href: "/admin/announcements", label: "الإعلانات" },
  { href: "/admin/reports", label: "التقارير" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("ADMIN");
  return (
    <PortalShell role="ADMIN" userName={user.name} nav={NAV}>
      {children}
    </PortalShell>
  );
}
