import Link from "next/link";
import type { ReactNode } from "react";
import { MobileNav, type NavItem } from "./mobile-nav";
import { SCHOOL_NAME, SCHOOL_PHONE, SCHOOL_EMAIL, SCHOOL_ADDRESS, STAGES } from "@/lib/constants";

export const PUBLIC_NAV: NavItem[] = [
  { href: "/about", label: "عن المدرسة" },
  { href: "/stages", label: "المراحل الدراسية" },
  { href: "/admissions", label: "القبول والتسجيل" },
  { href: "/news", label: "الأخبار" },
  { href: "/events", label: "الفعاليات" },
  { href: "/gallery", label: "معرض الصور" },
  { href: "/contact", label: "تواصل معنا" },
];

const PORTAL: NavItem = { href: "/login", label: "بوابة المدرسة" };

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="sticky top-0 z-30 border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="min-w-0 truncate text-lg font-bold text-brand">
            {SCHOOL_NAME}
          </Link>
          <nav aria-label="القائمة الرئيسية" className="hidden items-center gap-1 lg:flex">
            {PUBLIC_NAV.map((i) => (
              <Link key={i.href} href={i.href} className="rounded-lg px-3 py-2 text-sm text-ink hover:bg-brand-soft">
                {i.label}
              </Link>
            ))}
            <Link
              href={PORTAL.href}
              className="ms-2 inline-flex min-h-10 items-center rounded-lg bg-brand px-4 text-sm font-medium text-brand-ink hover:bg-ink"
            >
              {PORTAL.label}
            </Link>
          </nav>
          <MobileNav items={PUBLIC_NAV} cta={PORTAL} />
        </div>
      </header>
      <main id="main" tabIndex={-1}>
        {children}
      </main>
      <footer className="mt-16 border-t border-line bg-surface">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-brand">{SCHOOL_NAME}</p>
            <p className="mt-2 text-sm text-muted">{SCHOOL_ADDRESS}</p>
            <p className="mt-1 text-sm text-muted">
              هاتف: <span dir="ltr">{SCHOOL_PHONE}</span>
            </p>
            <p className="text-sm text-muted">
              البريد: <span dir="ltr">{SCHOOL_EMAIL}</span>
            </p>
          </div>
          <div>
            <p className="font-medium">المراحل</p>
            <ul className="mt-2 space-y-1 text-sm">
              {STAGES.map((s) => (
                <li key={s.key}>
                  <Link href={`/stages/${s.slug}`} className="text-muted hover:text-brand">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium">روابط سريعة</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                <Link href="/admissions/apply" className="text-muted hover:text-brand">
                  تقديم طلب التحاق
                </Link>
              </li>
              <li>
                <Link href="/admissions/status" className="text-muted hover:text-brand">
                  متابعة حالة الطلب
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-muted hover:text-brand">
                  دخول أولياء الأمور والمعلمين
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="border-t border-line py-4 text-center text-xs text-muted">
          © {new Date().getFullYear()} {SCHOOL_NAME}. جميع الحقوق محفوظة.
        </p>
      </footer>
    </>
  );
}
