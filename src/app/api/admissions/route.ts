import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { applicationSchema, fieldErrors } from "@/lib/validation";
import { clientKey, publicFormLimiter } from "@/lib/rate-limit";
import { generateReference } from "@/lib/admissions";

export async function POST(request: Request) {
  const limit = publicFormLimiter.check(`apply:${clientKey(request.headers)}`);
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

  const parsed = applicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }
  const v = parsed.data;

  for (let attempt = 0; attempt < 5; attempt++) {
    const reference = generateReference();
    try {
      await db.application.create({
        data: {
          reference,
          studentName: v.studentName,
          birthDate: new Date(`${v.birthDate}T00:00:00Z`),
          gender: v.gender,
          stage: v.stage,
          level: v.level,
          guardianName: v.guardianName,
          phone: v.phone,
          email: v.email,
          previousSchool: v.previousSchool,
          notes: v.notes,
        },
      });
      return NextResponse.json({ ok: true, reference }, { status: 201 });
    } catch (error) {
      const code = (error as { code?: string }).code;
      if (code !== "P2002") throw error; // retry only on a reference collision
    }
  }
  return NextResponse.json({ ok: false, error: "تعذّر إنشاء رقم الطلب، حاول مرة أخرى" }, { status: 500 });
}
