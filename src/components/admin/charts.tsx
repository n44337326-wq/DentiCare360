import { cn } from "@/lib/utils";

export interface ChartDatum {
  label: string;
  value: number;
  /** Optional secondary label shown under the bar (short form of `label`). */
  short?: string;
}

const TONES = ["bg-navy", "bg-cyan", "bg-green", "bg-navy-light"] as const;

/**
 * Vertical CSS bar chart with a screen-reader table. The bars are decorative
 * (aria-hidden); the same numbers are always available as text.
 */
export function ColumnChart({
  data,
  caption,
  valueLabel = "Appointments",
  height = 140,
}: {
  data: ChartDatum[];
  caption: string;
  valueLabel?: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-[26rem] items-end gap-1.5" style={{ height: height + 40 }} aria-hidden="true">
          {data.map((d) => (
            <div key={d.label} className="flex flex-1 flex-col items-center justify-end gap-1">
              <span className="text-[11px] font-semibold text-navy">{d.value}</span>
              <div
                className={cn("w-full max-w-8 rounded-t-md bg-cyan transition-all duration-500 motion-reduce:transition-none", d.value === 0 && "bg-slate-200")}
                style={{ height: Math.max(4, Math.round((d.value / max) * height)) }}
              />
              <span className="text-[10px] leading-tight text-slate-600">{d.short ?? d.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* A wrapping div clips it; `sr-only` alone does not shrink a display:table element. */}
      <div className="sr-only">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <figcaption className="sr-only">{caption}</figcaption>
    </figure>
  );
}

/**
 * Horizontal CSS bar chart. Every bar row shows its value as visible text, and
 * a full data table sits underneath in a disclosure for anyone who prefers it.
 */
export function BarChart({
  data,
  caption,
  valueHeader = "Count",
  format = (n: number) => String(n),
  tone = 0,
  empty = "No data yet.",
  extraColumn,
}: {
  data: ChartDatum[];
  caption: string;
  valueHeader?: string;
  format?: (n: number) => string;
  tone?: number;
  empty?: string;
  extraColumn?: { header: string; values: string[] };
}) {
  if (data.length === 0) return <p className="rounded-lg border border-dashed border-border px-4 py-6 text-center text-sm text-slate-600">{empty}</p>;
  const max = Math.max(1, ...data.map((d) => d.value));
  const color = TONES[tone % TONES.length];

  return (
    <figure>
      <ul className="space-y-2.5" role="list" aria-label={caption}>
        {data.map((d) => (
          <li key={d.label} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm sm:grid-cols-[minmax(0,12rem)_1fr_auto]">
            <span className="truncate text-navy" title={d.label}>
              {d.label}
            </span>
            <span className="h-3 overflow-hidden rounded-full bg-soft-blue" aria-hidden="true">
              <span
                className={cn("block h-full rounded-full transition-all duration-500 motion-reduce:transition-none", color)}
                style={{ width: `${Math.max(d.value > 0 ? 3 : 0, (d.value / max) * 100)}%` }}
              />
            </span>
            <span className="min-w-10 text-right font-semibold tabular-nums text-navy">{format(d.value)}</span>
          </li>
        ))}
      </ul>
      <details className="mt-4 text-sm">
        <summary className="cursor-pointer text-xs font-medium text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
          View data table
        </summary>
        <div className="mt-2 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <caption className="sr-only">{caption}</caption>
            <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th scope="col" className="px-3 py-2">Name</th>
                <th scope="col" className="px-3 py-2 text-right">{valueHeader}</th>
                {extraColumn && <th scope="col" className="px-3 py-2 text-right">{extraColumn.header}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map((d, i) => (
                <tr key={d.label}>
                  <th scope="row" className="px-3 py-2 font-medium text-navy">{d.label}</th>
                  <td className="px-3 py-2 text-right tabular-nums">{format(d.value)}</td>
                  {extraColumn && <td className="px-3 py-2 text-right tabular-nums">{extraColumn.values[i]}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
