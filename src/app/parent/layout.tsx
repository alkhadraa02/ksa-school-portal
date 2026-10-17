import type { Metadata } from "next";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "بوابة ولي الأمر", template: "%s | بوابة ولي الأمر" },
  robots: { index: false, follow: false },
};

const NAV = [
  { href: "/parent", label: "أبنائي" },
  { href: "/parent/attendance", label: "الحضور والغياب" },
  { href: "/parent/grades", label: "الدرجات" },
  { href: "/parent/timetable", label: "الجدول الدراسي" },
  { href: "/parent/fees", label: "الرسوم والفواتير" },
  { href: "/parent/messages", label: "الرسائل" },
];

export default async function ParentLayout({ children }: { children: ReactNode }) {
  const user = await requireRole("PARENT");
  return (
    <PortalShell role="PARENT" userName={user.name} nav={NAV}>
      {children}
    </PortalShell>
  );
}
