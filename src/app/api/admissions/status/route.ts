import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { statusLookupSchema, fieldErrors } from "@/lib/validation";
import { clientKey, lookupLimiter } from "@/lib/rate-limit";
import { APPLICATION_HINTS, APPLICATION_LABELS, levelName, stageLabel, type ApplicationStatus } from "@/lib/constants";

export async function POST(request: Request) {
  const limit = lookupLimiter.check(`lookup:${clientKey(request.headers)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "محاولات كثيرة، حاول لاحقاً" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = statusLookupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  const app = await db.application.findUnique({ where: { reference: parsed.data.reference } });
  // Same answer whether the reference or the phone is wrong, so references cannot be probed.
  if (!app || app.phone !== parsed.data.phone) {
    return NextResponse.json({ ok: false, error: "لم نعثر على طلب بهذه البيانات" }, { status: 404 });
  }

  const status = app.status as ApplicationStatus;
  return NextResponse.json({
    ok: true,
    application: {
      reference: app.reference,
      studentName: app.studentName,
      stage: stageLabel(app.stage),
      level: levelName(app.stage, app.level),
      status,
      statusLabel: APPLICATION_LABELS[status] ?? status,
      hint: APPLICATION_HINTS[status] ?? "",
      submittedAt: app.createdAt.toISOString(),
      updatedAt: app.updatedAt.toISOString(),
    },
  });
}
