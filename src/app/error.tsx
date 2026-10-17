"use client";

import { buttonClass } from "@/components/ui";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main id="main" className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-bold">حدث خطأ غير متوقع</h1>
      <p className="text-muted">تعذّر تحميل هذه الصفحة. جرّب مرة أخرى وإن استمرت المشكلة فتواصل مع الإدارة.</p>
      <button type="button" onClick={reset} className={buttonClass("primary")}>إعادة المحاولة</button>
    </main>
  );
}
