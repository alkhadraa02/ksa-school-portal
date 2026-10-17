import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { contactSchema, fieldErrors } from "@/lib/validation";
import { clientKey, publicFormLimiter } from "@/lib/rate-limit";

export async function POST(request: Request) {
  const limit = publicFormLimiter.check(`contact:${clientKey(request.headers)}`);
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

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  await db.contactMessage.create({ data: parsed.data });
  return NextResponse.json({ ok: true }, { status: 201 });
}
