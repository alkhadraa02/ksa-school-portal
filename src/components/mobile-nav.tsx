"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export type NavItem = { href: string; label: string };

export function MobileNav({ items, cta }: { items: NavItem[]; cta: NavItem }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        aria-label="فتح القائمة"
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(true)}
        className="inline-flex size-11 items-center justify-center rounded-lg border border-line bg-surface"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
        </svg>
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-ink/50" aria-hidden="true" onClick={() => setOpen(false)} />
          <nav
            id="mobile-menu"
            aria-label="القائمة الرئيسية"
            className="fixed inset-y-0 end-0 z-50 flex w-72 max-w-[85vw] flex-col gap-1 overflow-y-auto bg-surface p-4 shadow-xl"
          >
            <button
              type="button"
              aria-label="إغلاق القائمة"
              onClick={() => setOpen(false)}
              className="mb-2 inline-flex size-11 items-center justify-center self-start rounded-lg border border-line"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
              </svg>
            </button>
            {items.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-3 text-ink hover:bg-brand-soft"
              >
                {i.label}
              </Link>
            ))}
            <Link
              href={cta.href}
              onClick={() => setOpen(false)}
              className="mt-3 rounded-lg bg-brand px-3 py-3 text-center font-medium text-brand-ink"
            >
              {cta.label}
            </Link>
          </nav>
        </>
      ) : null}
    </div>
  );
}
