"use client";

import { useState } from "react";
import { Alert, Field, buttonClass, inputClass } from "./ui";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done" }
  | { kind: "error"; message: string; fields: Record<string, string> };

export function ContactForm() {
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        form.reset();
        setState({ kind: "done" });
      } else {
        setState({
          kind: "error",
          message: json.error ?? "تعذّر إرسال الرسالة، راجع الحقول وحاول مرة أخرى.",
          fields: json.errors ?? {},
        });
      }
    } catch {
      setState({ kind: "error", message: "تعذّر الاتصال بالخادم، حاول لاحقاً.", fields: {} });
    }
  }

  const fields = state.kind === "error" ? state.fields : {};

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={state.kind === "sending"}>
      {state.kind === "done" ? <Alert tone="success">وصلتنا رسالتك وسنرد عليك قريباً. شكراً لتواصلك.</Alert> : null}
      {state.kind === "error" ? <Alert tone="danger">{state.message}</Alert> : null}
      <Field label="الاسم" name="name" error={fields.name}>
        <input id="name" name="name" required autoComplete="name" className={inputClass} aria-describedby={fields.name ? "name-error" : undefined} />
      </Field>
      <Field label="البريد الإلكتروني" name="email" error={fields.email}>
        <input id="email" name="email" type="email" required autoComplete="email" dir="ltr" className={inputClass} aria-describedby={fields.email ? "email-error" : undefined} />
      </Field>
      <Field label="رقم الجوال (اختياري)" name="phone" error={fields.phone} hint="مثال: 0501234567">
        <input id="phone" name="phone" type="tel" autoComplete="tel" dir="ltr" className={inputClass} aria-describedby={fields.phone ? "phone-error" : undefined} />
      </Field>
      <Field label="الرسالة" name="message" error={fields.message}>
        <textarea id="message" name="message" required rows={5} className={inputClass} aria-describedby={fields.message ? "message-error" : undefined} />
      </Field>
      <button type="submit" disabled={state.kind === "sending"} className={buttonClass("primary")}>
        {state.kind === "sending" ? "جارٍ الإرسال…" : "إرسال الرسالة"}
      </button>
    </form>
  );
}
