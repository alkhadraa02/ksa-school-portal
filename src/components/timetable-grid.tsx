import { DAYS, PERIOD_TIMES, PERIODS_PER_DAY } from "@/lib/constants";

export interface GridCell {
  day: number;
  period: number;
  title: string;
  sub?: string;
}

export function TimetableGrid({ cells, caption }: { cells: GridCell[]; caption: string }) {
  const at = new Map(cells.map((c) => [`${c.day}|${c.period}`, c]));
  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-surface">
      <table className="w-full min-w-[40rem] text-start text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr>
            <th scope="col" className="bg-bg px-3 py-2 text-start font-medium text-muted">الحصة</th>
            {DAYS.map((d) => (
              <th key={d} scope="col" className="bg-bg px-3 py-2 text-start font-medium text-muted">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: PERIODS_PER_DAY }, (_, i) => i + 1).map((p) => (
            <tr key={p}>
              <th scope="row" className="border-t border-line px-3 py-2 text-start font-medium">
                {p}
                <span className="block text-xs font-normal text-muted" dir="ltr">{PERIOD_TIMES[p - 1]}</span>
              </th>
              {DAYS.map((_, d) => {
                const c = at.get(`${d}|${p}`);
                return (
                  <td key={d} className="border-t border-line px-3 py-2 align-top">
                    {c ? (
                      <>
                        <span className="block font-medium">{c.title}</span>
                        {c.sub ? <span className="block text-xs text-muted">{c.sub}</span> : null}
                      </>
                    ) : (
                      <span className="text-muted" aria-label="لا توجد حصة">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
