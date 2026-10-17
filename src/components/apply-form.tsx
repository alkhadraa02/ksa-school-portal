"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, Field, buttonClass, inputClass } from "./ui";
import { STAGES } from "@/lib/constants";

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "done"; reference: string }
  | { kind: "error"; message: string; fields: Record<string, string> };

export function ApplyForm() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const [stage, setStage] = useState<string>(STAGES[1].key);
  const levels = STAGES.find((s) => s.key === stage)?.levels ?? [];

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (res.ok && json.reference) {
        form.reset();
        setState({ kind: "done", reference: json.reference });
      } else {
        setState({
          kind: "error",
          message: json.error ?? "تحقّق من الحقول المظلّلة ثم أعد المحاولة.",
          fields: json.errors ?? {},
        });
      }
    } catch {
      setState({ kind: "error", message: "تعذّر الاتصال بالخادم، حاول لاحقاً.", fields: {} });
    }
  }

  if (state.kind === "done") {
    return (
      <div className="grid gap-4">
        <Alert tone="success">
          استلمنا طلب الالتحاق بنجاح. احتفظ برقم الطلب التالي لمتابعة الحالة:
          <strong dir="ltr" className="mt-2 block text-start text-xl">{state.reference}</strong>
        </Alert>
        <Link href="/admissions/status" className={buttonClass("secondary")}>
          متابعة حالة الطلب
        </Link>
      </div>
    );
  }

  const f = state.kind === "error" ? state.fields : {};

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-4" aria-busy={state.kind === "sending"}>
      {state.kind === "error" ? <Alert tone="danger">{state.message}</Alert> : null}
      <h2 className="text-lg font-bold">بيانات الطالب</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="اسم الطالب الرباعي" name="studentName" error={f.studentName}>
          <input id="studentName" name="studentName" required className={inputClass} />
        </Field>
        <Field label="تاريخ الميلاد" name="birthDate" error={f.birthDate}>
          <input id="birthDate" name="birthDate" type="date" required dir="ltr" className={inputClass} />
        </Field>
        <Field label="الجنس" name="gender" error={f.gender}>
          <select id="gender" name="gender" required defaultValue="" className={inputClass}>
            <option value="" disabled>اختر</option>
            <option value="M">ذكر</option>
            <option value="F">أنثى</option>
          </select>
        </Field>
        <Field label="المدرسة السابقة (اختياري)" name="previousSchool" error={f.previousSchool}>
          <input id="previousSchool" name="previousSchool" className={inputClass} />
        </Field>
        <Field label="المرحلة" name="stage" error={f.stage}>
          <select id="stage" name="stage" value={stage} onChange={(e) => setStage(e.target.value)} className={inputClass}>
            {STAGES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>
        </Field>
        <Field label="الصف" name="level" error={f.level}>
          <select id="level" name="level" defaultValue="1" key={stage} className={inputClass}>
            {levels.map((l, i) => (
              <option key={l} value={i + 1}>{l}</option>
            ))}
          </select>
        </Field>
      </div>
      <h2 className="mt-2 text-lg font-bold">بيانات ولي الأمر</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="اسم ولي الأمر" name="guardianName" error={f.guardianName}>
          <input id="guardianName" name="guardianName" required autoComplete="name" className={inputClass} />
        </Field>
        <Field label="رقم الجوال" name="phone" error={f.phone} hint="مثال: 0501234567">
          <input id="phone" name="phone" type="tel" required autoComplete="tel" dir="ltr" className={inputClass} />
        </Field>
        <Field label="البريد الإلكتروني (اختياري)" name="email" error={f.email}>
          <input id="email" name="email" type="email" autoComplete="email" dir="ltr" className={inputClass} />
        </Field>
      </div>
      <Field label="ملاحظات (اختياري)" name="notes" error={f.notes}>
        <textarea id="notes" name="notes" rows={3} className={inputClass} />
      </Field>
      <button type="submit" disabled={state.kind === "sending"} className={buttonClass("primary")}>
        {state.kind === "sending" ? "جارٍ الإرسال…" : "إرسال الطلب"}
      </button>
    </form>
  );
}
