import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { hashToken, newSessionToken } from "./password";
import { ROLE_HOME, type Role } from "./constants";

export const SESSION_COOKIE = "school_session";

function sessionDays() {
  const n = Number(process.env.SESSION_DAYS ?? 7);
  return Number.isFinite(n) && n > 0 ? n : 7;
}

function secureCookies() {
  return (process.env.SITE_URL ?? "").startsWith("https://");
}

export async function createSession(userId: string) {
  const token = newSessionToken();
  const expiresAt = new Date(Date.now() + sessionDays() * 24 * 3600 * 1000);
  await db.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: secureCookies(),
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  store.delete(SESSION_COOKIE);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() < Date.now() || !session.user.active) return null;
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role as Role,
  };
});

export async function requireRole(role: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(ROLE_HOME[role])}`);
  if (user.role !== role) redirect(ROLE_HOME[user.role]);
  return user;
}

/** For server actions: throws instead of redirecting so the action can answer with an error. */
export async function assertRole(role: Role): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user || user.role !== role) throw new Error("غير مصرّح لك بتنفيذ هذا الإجراء");
  return user;
}

export async function getTeacherProfile(userId: string) {
  return db.teacher.findUnique({ where: { userId } });
}
