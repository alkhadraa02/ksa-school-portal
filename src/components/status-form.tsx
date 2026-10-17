"use client";

import { useState } from "react";
import { Alert, Badge, Card, Field, buttonClass, inputClass } from "./ui";

type Result = {
  reference: string;
  studentName: string;
  stage: string;
  level: string;
  status: string;
  statusLabel: string;
  hint: string;
  submittedAt: string;
  updatedAt: string;
};

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "found"; app: Result }
  | { kind: "error"; message: string; fields: Record<string, string> };

const TONES: Record<string, "success" | "info" | "warning" | "danger" | "neutral"> = {
  PENDING: "neutral",
  REVIEW: "info",
  ACCEPTED: "success",
  WAITLIST: "warning",
  REJECTED: "danger",
};

const DATE = new Intl.DateTimeFormat("ar-SA-u-ca-gregory-nu-latn", { timeZone: "Asia/Riyadh", dateStyle: "long" });

export function StatusForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/admissions/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.application) setState({ kind: "found", app: json.application });
      else setState({ kind: "error", message: json.error ?? "راجع الحقول وأعد المحاولة.", fields: json.errors ?? {} });
    } catch {
      setState({ kind: "error", message: "تعذّر الاتصال بالخادم، حاول لاحقاً.", fields: {} });
    }
  }

  const f = state.kind === "error" ? state.fields : {};

  return (
    <div className="grid gap-6">
      <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={state.kind === "sending"}>
        {state.kind === "error" ? <Alert tone="danger">{state.message}</Alert> : null}
        <Field label="رقم الطلب" name="reference" error={f.reference} hint="مثال: ADM-2026-K7P2QX">
          <input id="reference" name="reference" required dir="ltr" autoComplete="off" className={inputClass} />
        </Field>
        <Field label="رقم الجوال المسجّل في الطلب" name="phone" error={f.phone}>
          <input id="phone" name="phone" type="tel" required dir="ltr" autoComplete="tel" className={inputClass} />
        </Field>
        <button type="submit" disabled={state.kind === "sending"} className={buttonClass("primary")}>
          {state.kind === "sending" ? "جارٍ البحث…" : "استعلام"}
        </button>
      </form>
      {state.kind === "found" ? (
        <Card aria-live="polite">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">{state.app.studentName}</h2>
            <Badge tone={TONES[state.app.status] ?? "neutral"}>{state.app.statusLabel}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">
            {state.app.level} — {state.app.stage}
          </p>
          <p className="mt-3">{state.app.hint}</p>
          <p className="mt-3 text-xs text-muted">
            تاريخ التقديم: {DATE.format(new Date(state.app.submittedAt))} · آخر تحديث: {DATE.format(new Date(state.app.updatedAt))}
          </p>
        </Card>
      ) : null}
    </div>
  );
}
