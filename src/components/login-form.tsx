"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Field, buttonClass, inputClass } from "./ui";

function safeNext(next: string | undefined, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : fallback;
}

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setBusy(true);
    setError(null);
    setFields({});
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        router.replace(safeNext(next, json.home ?? "/"));
        router.refresh();
        return;
      }
      setError(json.error ?? "تحقّق من الحقول وأعد المحاولة.");
      setFields(json.errors ?? {});
    } catch {
      setError("تعذّر الاتصال بالخادم، حاول لاحقاً.");
    }
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={busy}>
      {error ? <Alert tone="danger">{error}</Alert> : null}
      <Field label="البريد الإلكتروني" name="email" error={fields.email}>
        <input id="email" name="email" type="email" required autoComplete="username" dir="ltr" className={inputClass} />
      </Field>
      <Field label="كلمة المرور" name="password" error={fields.password}>
        <input id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" className={inputClass} />
      </Field>
      <button type="submit" disabled={busy} className={buttonClass("primary")}>
        {busy ? "جارٍ الدخول…" : "تسجيل الدخول"}
      </button>
    </form>
  );
}
