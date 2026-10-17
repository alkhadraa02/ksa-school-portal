import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { DUMMY_HASH, verifyPassword } from "@/lib/password";
import { loginSchema, fieldErrors } from "@/lib/validation";
import { clientKey, loginLimiter } from "@/lib/rate-limit";
import { ROLE_HOME, type Role } from "@/lib/constants";

export async function POST(request: Request) {
  const limit = loginLimiter.check(`login:${clientKey(request.headers)}`);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "محاولات دخول كثيرة، حاول بعد قليل" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "طلب غير صالح" }, { status: 400 });
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, errors: fieldErrors(parsed.error) }, { status: 422 });
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });
  const valid = verifyPassword(parsed.data.password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !user.active || !valid) {
    return NextResponse.json({ ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ ok: true, home: ROLE_HOME[user.role as Role] ?? "/" });
}
