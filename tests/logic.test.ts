import { describe, expect, it } from "vitest";
import { auditTimetable, findConflicts, generateTimetable } from "@/lib/timetable";
import { classRanking, gradeLabel, percent, weightedAverage } from "@/lib/grades";
import { summarizeAttendance } from "@/lib/attendance";
import { balance, invoiceNumber, invoiceStatus, splitInstallments } from "@/lib/fees";
import { hashPassword, verifyPassword } from "@/lib/password";
import { createLimiter } from "@/lib/rate-limit";
import { generateReference } from "@/lib/admissions";
import { applicationSchema, classSchema } from "@/lib/validation";

describe("timetable", () => {
  it("detects class and teacher clashes", () => {
    const existing = [{ classId: "c1", day: 0, period: 1, subjectId: "s1", teacherId: "t1" }];
    expect(findConflicts(existing, { classId: "c1", day: 0, period: 1, subjectId: "s2", teacherId: "t2" })[0].kind).toBe("CLASS");
    expect(findConflicts(existing, { classId: "c2", day: 0, period: 1, subjectId: "s2", teacherId: "t1" })[0].kind).toBe("TEACHER");
    expect(findConflicts(existing, { classId: "c2", day: 0, period: 2, subjectId: "s2", teacherId: "t1" })).toHaveLength(0);
  });

  it("generates a clash-free timetable even when teachers are shared", () => {
    const lessons = ["c1", "c2", "c3"].flatMap((classId) => [
      { classId, subjectId: "math", teacherId: "t-math", periods: 5 },
      { classId, subjectId: "arabic", teacherId: "t-arabic", periods: 5 },
      { classId, subjectId: "science", teacherId: `t-sci-${classId}`, periods: 3 },
    ]);
    const { slots, unplaced } = generateTimetable(lessons);
    expect(unplaced).toHaveLength(0);
    expect(slots).toHaveLength(39);
    expect(auditTimetable(slots)).toHaveLength(0);
  });

  it("reports lessons it cannot place instead of double-booking", () => {
    const lessons = [
      { classId: "c1", subjectId: "a", teacherId: "t", periods: 20 },
      { classId: "c2", subjectId: "a", teacherId: "t", periods: 20 },
    ];
    const { slots, unplaced } = generateTimetable(lessons, { days: 1, periodsPerDay: 7 });
    expect(slots).toHaveLength(7);
    expect(unplaced.reduce((n, u) => n + u.missing, 0)).toBe(33);
    expect(auditTimetable(slots)).toHaveLength(0);
  });
});

describe("grades and attendance", () => {
  it("computes percentages, averages and labels", () => {
    expect(percent(45, 50)).toBe(90);
    expect(percent(1, 0)).toBe(0);
    expect(weightedAverage([{ score: 18, max: 20 }, { score: 40, max: 80 }])).toBe(58);
    expect(weightedAverage([])).toBeNull();
    expect(gradeLabel(91)).toBe("ممتاز");
    expect(gradeLabel(40)).toBe("دون المستوى");
  });

  it("ranks ties equally", () => {
    const ranks = classRanking([
      { studentId: "a", average: 95 },
      { studentId: "b", average: 95 },
      { studentId: "c", average: 80 },
    ]);
    expect(ranks.get("a")).toBe(1);
    expect(ranks.get("b")).toBe(1);
    expect(ranks.get("c")).toBe(3);
  });

  it("summarizes attendance with late counted as present", () => {
    const s = summarizeAttendance([{ status: "PRESENT" }, { status: "LATE" }, { status: "ABSENT" }, { status: "EXCUSED" }]);
    expect(s).toMatchObject({ total: 4, present: 1, late: 1, absent: 1, excused: 1, rate: 50 });
    expect(summarizeAttendance([]).rate).toBe(0);
  });
});

describe("fees", () => {
  it("splits installments exactly", () => {
    const parts = splitInstallments(10000, 3);
    expect(parts.reduce((a, b) => a + b, 0)).toBe(10000);
    expect(Math.max(...parts) - Math.min(...parts)).toBeLessThanOrEqual(1);
  });

  it("derives invoice status and balance", () => {
    const due = new Date("2026-09-01T00:00:00Z");
    const before = new Date("2026-08-01T00:00:00Z");
    const after = new Date("2026-10-01T00:00:00Z");
    expect(invoiceStatus({ amount: 1000, dueDate: due, payments: [] }, before)).toBe("UNPAID");
    expect(invoiceStatus({ amount: 1000, dueDate: due, payments: [{ amount: 400 }] }, before)).toBe("PARTIAL");
    expect(invoiceStatus({ amount: 1000, dueDate: due, payments: [{ amount: 400 }] }, after)).toBe("OVERDUE");
    expect(invoiceStatus({ amount: 1000, dueDate: due, payments: [{ amount: 1000 }] }, after)).toBe("PAID");
    expect(balance({ amount: 1000, payments: [{ amount: 1200 }] })).toBe(0);
    expect(invoiceNumber(2026, 42)).toBe("INV-2026-000042");
  });
});

describe("security helpers", () => {
  it("hashes passwords with a per-password salt and verifies them", () => {
    const a = hashPassword("correct horse battery");
    const b = hashPassword("correct horse battery");
    expect(a).not.toBe(b);
    expect(a).not.toContain("correct horse");
    expect(verifyPassword("correct horse battery", a)).toBe(true);
    expect(verifyPassword("wrong", a)).toBe(false);
    expect(verifyPassword("x", "garbage")).toBe(false);
  });

  it("limits requests per window and recovers after it", () => {
    const l = createLimiter(2, 1000);
    expect(l.check("k", 0).ok).toBe(true);
    expect(l.check("k", 1).ok).toBe(true);
    const blocked = l.check("k", 2);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSec).toBeGreaterThan(0);
    expect(l.check("other", 3).ok).toBe(true);
    expect(l.check("k", 1500).ok).toBe(true);
  });

  it("generates well-formed references", () => {
    expect(generateReference(2026)).toMatch(/^ADM-2026-[A-Z2-9]{6}$/);
  });
});

describe("validation", () => {
  const valid = {
    studentName: "فيصل بن عبدالله القحطاني",
    birthDate: "2018-03-14",
    gender: "M",
    stage: "PRIMARY",
    level: "1",
    guardianName: "عبدالله القحطاني",
    phone: "0501234567",
  };

  it("accepts a valid application and rejects bad input", () => {
    expect(applicationSchema.safeParse(valid).success).toBe(true);
    expect(applicationSchema.safeParse({ ...valid, phone: "123" }).success).toBe(false);
    expect(applicationSchema.safeParse({ ...valid, studentName: "" }).success).toBe(false);
  });

  it("rejects a level that does not belong to the stage", () => {
    const r = classSchema.safeParse({ stage: "KINDERGARTEN", level: 5, section: "أ", year: "2026/2027", capacity: 25 });
    expect(r.success).toBe(false);
  });
});
