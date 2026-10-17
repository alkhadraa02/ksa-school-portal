import { PERIODS_PER_DAY } from "./constants";

export interface SlotLike {
  id?: string;
  classId: string;
  day: number;
  period: number;
  subjectId: string;
  teacherId: string;
}

export interface Conflict {
  kind: "CLASS" | "TEACHER";
  with: SlotLike;
}

/**
 * A class has one lesson per period and a teacher can be in one class per period.
 * Returns every clash between `candidate` and the existing slots.
 */
export function findConflicts(existing: SlotLike[], candidate: SlotLike, ignoreId?: string): Conflict[] {
  const out: Conflict[] = [];
  for (const s of existing) {
    if (ignoreId && s.id === ignoreId) continue;
    if (s.day !== candidate.day || s.period !== candidate.period) continue;
    if (s.classId === candidate.classId) out.push({ kind: "CLASS", with: s });
    else if (s.teacherId === candidate.teacherId) out.push({ kind: "TEACHER", with: s });
  }
  return out;
}

/** Detect all clashes inside a full timetable (used by reports and tests). */
export function auditTimetable(slots: SlotLike[]): Conflict[] {
  const seenClass = new Map<string, SlotLike>();
  const seenTeacher = new Map<string, SlotLike>();
  const out: Conflict[] = [];
  for (const s of slots) {
    const ck = `${s.classId}|${s.day}|${s.period}`;
    const tk = `${s.teacherId}|${s.day}|${s.period}`;
    const c = seenClass.get(ck);
    if (c) out.push({ kind: "CLASS", with: c });
    else seenClass.set(ck, s);
    const t = seenTeacher.get(tk);
    if (t) out.push({ kind: "TEACHER", with: t });
    else seenTeacher.set(tk, s);
  }
  return out;
}

export interface Lesson {
  classId: string;
  subjectId: string;
  teacherId: string;
  periods: number;
}

export interface GenerateOptions {
  days?: number;
  periodsPerDay?: number;
  /** Slots that already exist and must be respected (never moved). */
  existing?: SlotLike[];
}

export interface GenerateResult {
  slots: SlotLike[];
  unplaced: { classId: string; subjectId: string; missing: number }[];
}

/**
 * Greedy clash-free timetable generator. Spreads each subject across different days,
 * keeps days compact (earliest free period) and never double-books a class or teacher.
 */
export function generateTimetable(lessons: Lesson[], opts: GenerateOptions = {}): GenerateResult {
  const days = opts.days ?? 5;
  const periodsPerDay = opts.periodsPerDay ?? PERIODS_PER_DAY;
  const busyTeacher = new Set<string>();
  const busyClass = new Set<string>();
  const classDayLoad = new Map<string, number>();
  for (const s of opts.existing ?? []) {
    busyTeacher.add(`${s.teacherId}|${s.day}|${s.period}`);
    busyClass.add(`${s.classId}|${s.day}|${s.period}`);
    const k = `${s.classId}|${s.day}`;
    classDayLoad.set(k, (classDayLoad.get(k) ?? 0) + 1);
  }

  const slots: SlotLike[] = [];
  const unplaced: GenerateResult["unplaced"] = [];
  const ordered = [...lessons].sort((a, b) => b.periods - a.periods);

  for (const lesson of ordered) {
    const subjectOnDay = new Map<number, number>();
    let missing = 0;
    for (let n = 0; n < lesson.periods; n++) {
      let best: { day: number; period: number; score: number } | null = null;
      for (let day = 0; day < days; day++) {
        const sameSubject = subjectOnDay.get(day) ?? 0;
        const load = classDayLoad.get(`${lesson.classId}|${day}`) ?? 0;
        for (let period = 1; period <= periodsPerDay; period++) {
          if (busyClass.has(`${lesson.classId}|${day}|${period}`)) continue;
          if (busyTeacher.has(`${lesson.teacherId}|${day}|${period}`)) continue;
          const score = sameSubject * 1000 + load * 20 + period;
          if (!best || score < best.score) best = { day, period, score };
          break; // earliest free period on this day is enough
        }
      }
      if (!best) {
        missing += 1;
        continue;
      }
      busyClass.add(`${lesson.classId}|${best.day}|${best.period}`);
      busyTeacher.add(`${lesson.teacherId}|${best.day}|${best.period}`);
      subjectOnDay.set(best.day, (subjectOnDay.get(best.day) ?? 0) + 1);
      classDayLoad.set(
        `${lesson.classId}|${best.day}`,
        (classDayLoad.get(`${lesson.classId}|${best.day}`) ?? 0) + 1,
      );
      slots.push({
        classId: lesson.classId,
        day: best.day,
        period: best.period,
        subjectId: lesson.subjectId,
        teacherId: lesson.teacherId,
      });
    }
    if (missing > 0) unplaced.push({ classId: lesson.classId, subjectId: lesson.subjectId, missing });
  }
  return { slots, unplaced };
}

export function teacherLoad(slots: SlotLike[]) {
  const load = new Map<string, number>();
  for (const s of slots) load.set(s.teacherId, (load.get(s.teacherId) ?? 0) + 1);
  return load;
}
