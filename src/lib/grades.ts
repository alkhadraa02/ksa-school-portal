export function percent(score: number, max: number) {
  if (!(max > 0)) return 0;
  return Math.round((score / max) * 1000) / 10;
}

export function gradeLabel(p: number) {
  if (p >= 90) return "ممتاز";
  if (p >= 80) return "جيد جداً";
  if (p >= 70) return "جيد";
  if (p >= 60) return "مقبول";
  return "دون المستوى";
}

export function gradeTone(p: number): "success" | "info" | "warning" | "danger" {
  if (p >= 85) return "success";
  if (p >= 70) return "info";
  if (p >= 60) return "warning";
  return "danger";
}

/** Weighted average: total score over total maximum, as a percentage. */
export function weightedAverage(entries: { score: number; max: number }[]) {
  const max = entries.reduce((s, e) => s + e.max, 0);
  if (max <= 0) return null;
  const score = entries.reduce((s, e) => s + e.score, 0);
  return percent(score, max);
}

export function classRanking(rows: { studentId: string; average: number }[]) {
  const sorted = [...rows].sort((a, b) => b.average - a.average);
  const ranks = new Map<string, number>();
  let last = -1;
  let rank = 0;
  sorted.forEach((r, i) => {
    if (r.average !== last) {
      rank = i + 1;
      last = r.average;
    }
    ranks.set(r.studentId, rank);
  });
  return ranks;
}
