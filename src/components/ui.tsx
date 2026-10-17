import Link from "next/link";
import type { ReactNode } from "react";

export const btn = {
  base: "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium transition-colors disabled:opacity-60",
  primary: "bg-brand text-brand-ink hover:bg-ink",
  secondary: "border border-line bg-surface text-ink hover:bg-brand-soft",
  danger: "bg-danger text-brand-ink hover:opacity-90",
};

export function buttonClass(kind: "primary" | "secondary" | "danger" = "primary") {
  return `${btn.base} ${btn[kind]}`;
}

export function LinkButton({
  href,
  kind = "primary",
  children,
}: {
  href: string;
  kind?: "primary" | "secondary" | "danger";
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(kind)}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-xl border border-line bg-surface p-5 ${className}`}>{children}</div>;
}

const tones = {
  success: "bg-success-soft text-success",
  info: "bg-info-soft text-info",
  warning: "bg-warning-soft text-warning",
  danger: "bg-danger-soft text-danger",
  neutral: "bg-bg text-muted border border-line",
};

export function Badge({ tone = "neutral", children }: { tone?: keyof typeof tones; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

export function PageHeader({ title, lead, actions }: { title: string; lead?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold text-ink md:text-3xl">{title}</h1>
        {lead ? <p className="mt-1 max-w-2xl text-muted">{lead}</p> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface p-8 text-center">
      <p className="font-medium text-ink">{title}</p>
      {hint ? <p className="mt-1 text-sm text-muted">{hint}</p> : null}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "success" | "info" | "warning" | "danger"; children: ReactNode }) {
  return (
    <div role={tone === "danger" ? "alert" : "status"} className={`rounded-lg px-4 py-3 text-sm ${tones[tone]}`}>
      {children}
    </div>
  );
}

export const inputClass =
  "block min-h-11 w-full rounded-lg border border-line bg-surface px-3 py-2 text-ink placeholder:text-muted";

export function Field({
  label,
  name,
  error,
  hint,
  children,
}: {
  label: string;
  name: string;
  error?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={name} className="mb-1 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {hint && !error ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
      {error ? (
        <p id={`${name}-error`} className="mt-1 text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[32rem] text-start text-sm">{children}</table>
    </div>
  );
}

export const th = "bg-bg px-3 py-2 text-start font-medium text-muted";
export const td = "border-t border-line px-3 py-2 align-top";

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <Card>
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
    </Card>
  );
}
