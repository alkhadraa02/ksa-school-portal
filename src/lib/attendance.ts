import type { AttendanceStatus } from "./constants";

export interface AttendanceSummary {
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  /** (present + late) / total, as a percentage with one decimal. */
  rate: number;
}

export function summarizeAttendance(records: { status: string }[]): AttendanceSummary {
  const count = (s: AttendanceStatus) => records.filter((r) => r.status === s).length;
  const present = count("PRESENT");
  const late = count("LATE");
  const total = records.length;
  return {
    total,
    present,
    absent: count("ABSENT"),
    late,
    excused: count("EXCUSED"),
    rate: total === 0 ? 0 : Math.round(((present + late) / total) * 1000) / 10,
  };
}
