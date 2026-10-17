import { db } from "./db";
import { getTeacherProfile } from "./auth";

export async function parentChildren(parentId: string) {
  return db.student.findMany({
    where: { parentId, status: "ACTIVE" },
    include: { class: true },
    orderBy: { name: "asc" },
  });
}

export function pickChild<T extends { id: string }>(children: T[], id?: string) {
  return children.find((c) => c.id === id) ?? children[0] ?? null;
}

/** The teacher profile plus every class/subject pair they are assigned to. */
export async function teacherContext(userId: string) {
  const teacher = await getTeacherProfile(userId);
  if (!teacher) return null;
  const assignments = await db.teachingAssignment.findMany({
    where: { teacherId: teacher.id },
    include: { class: true, subject: true },
    orderBy: [{ class: { stage: "asc" } }, { class: { level: "asc" } }],
  });
  return { teacher, assignments };
}

export type OneOrMany = string | string[] | undefined;
export function first(v: OneOrMany) {
  return Array.isArray(v) ? v[0] : v;
}
