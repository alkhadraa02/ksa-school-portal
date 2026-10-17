import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutButton } from "./logout-button";
import { ROLE_LABELS, SCHOOL_NAME, type Role } from "@/lib/constants";

export type PortalNav = { href: string; label: string };

export function PortalShell({
  role,
  userName,
  nav,
  children,
}: {
  role: Role;
  userName: string;
  nav: PortalNav[];
  children: ReactNode;
}) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link href="/" className="min-w-0 truncate text-lg font-bold text-brand">
            {SCHOOL_NAME}
          </Link>
          <div className="flex min-w-0 items-center gap-3 text-sm">
            <span className="min-w-0 truncate text-muted">
              {ROLE_LABELS[role]} · {userName}
            </span>
            <LogoutButton />
          </div>
        </div>
        <nav aria-label="قائمة البوابة" className="mx-auto max-w-7xl overflow-x-auto px-4">
          <ul className="flex gap-1 pb-2">
            {nav.map((i) => (
              <li key={i.href}>
                <Link
                  href={i.href}
                  className="inline-flex min-h-10 items-center whitespace-nowrap rounded-lg px-3 text-sm text-ink hover:bg-brand-soft"
                >
                  {i.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 py-8">
        {children}
      </main>
    </>
  );
}

export function Flash({ ok, error }: { ok?: string; error?: string }) {
  if (!ok && !error) return null;
  return (
    <div className="mb-4">
      {error ? (
        <div role="alert" className="rounded-lg bg-danger-soft px-4 py-3 text-sm text-danger">
          {error.slice(0, 200)}
        </div>
      ) : (
        <div role="status" className="rounded-lg bg-success-soft px-4 py-3 text-sm text-success">
          {ok?.slice(0, 200)}
        </div>
      )}
    </div>
  );
}
