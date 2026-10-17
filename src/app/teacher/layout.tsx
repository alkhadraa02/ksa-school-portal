import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "بوابة المعلم", template: "%s | بوابة المعلم" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/teacher", label: "فصولي وجدولي" },
  { href: "/teacher/attendance", label: "تسجيل الحضور" },
  { href: "/teacher/grades", label: "الدرجات" },
  { href: "/teacher/homework", label: "الواجبات" },
  { href: "/teacher/messages", label: "الرسائل" },
];

export default async function TeacherLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("TEACHER");
  return (
    <PortalShell role="TEACHER" userName={user.name} nav={NAV}>
      {children}
    </PortalShell>
  );
}
