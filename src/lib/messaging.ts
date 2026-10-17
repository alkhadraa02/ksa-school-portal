import { db } from "./db";
import type { SessionUser } from "./auth";

export interface Recipient {
  id: string;
  name: string;
  label: string;
  students: { id: string; name: string }[];
}

/**
 * Parents may write to teachers of their children's classes, teachers to parents of the
 * students they teach. Nobody else can be messaged, so this list is also the authorisation check.
 */
export async function allowedRecipients(user: Pick<SessionUser, "id" | "role">): Promise<Recipient[]> {
  if (user.role === "PARENT") {
    const kids = await db.student.findMany({
      where: { parentId: user.id },
      select: { id: true, name: true, classId: true },
    });
    const classIds = kids.map((k) => k.classId).filter((x): x is string => !!x);
    const assignments = await db.teachingAssignment.findMany({
      where: { classId: { in: classIds } },
      include: { teacher: { include: { user: true } }, subject: true },
    });
    const map = new Map<string, Recipient>();
    for (const a of assignments) {
      const key = a.teacher.userId;
      const entry = map.get(key) ?? { id: key, name: a.teacher.user.name, label: "", students: [] };
      const subjects = new Set(entry.label ? entry.label.split("، ") : []);
      subjects.add(a.subject.name);
      entry.label = [...subjects].join("، ");
      for (const k of kids) {
        if (k.classId === a.classId && !entry.students.some((s) => s.id === k.id)) {
          entry.students.push({ id: k.id, name: k.name });
        }
      }
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  if (user.role === "TEACHER") {
    const teacher = await db.teacher.findUnique({ where: { userId: user.id } });
    if (!teacher) return [];
    const assignments = await db.teachingAssignment.findMany({
      where: { teacherId: teacher.id },
      select: { classId: true },
    });
    const students = await db.student.findMany({
      where: { classId: { in: assignments.map((a) => a.classId) }, parentId: { not: null } },
      include: { parent: true },
    });
    const map = new Map<string, Recipient>();
    for (const s of students) {
      if (!s.parent || !s.parentId) continue;
      const entry = map.get(s.parentId) ?? { id: s.parentId, name: s.parent.name, label: "ولي أمر", students: [] };
      entry.students.push({ id: s.id, name: s.name });
      map.set(s.parentId, entry);
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }

  return [];
}
