"use client";

import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { DAY_NAMES, type DayRow, type ScheduleErrors } from "@/components/doctor/availability-model";
import { ToggleSwitch } from "@/components/doctor/toggle-switch";

const FIELDS = [
  ["startTime", "start"],
  ["endTime", "end"],
  ["breakStart", "bs"],
  ["breakEnd", "be"],
] as const;

function TimeField({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs text-slate-700">
        {label}
      </Label>
      <Input
        id={id}
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-err` : undefined}
        className={cn(error && "border-red-500 focus-visible:ring-red-500")}
      />
    </div>
  );
}

/** Seven rows: working toggle, working hours and an optional break per weekday. */
export function WeeklyHoursEditor({
  days,
  onChange,
  errors,
  idPrefix,
}: {
  days: DayRow[];
  onChange: (days: DayRow[]) => void;
  errors: ScheduleErrors;
  idPrefix: string;
}) {
  const update = (dayOfWeek: number, patch: Partial<DayRow>) =>
    onChange(days.map((d) => (d.dayOfWeek === dayOfWeek ? { ...d, ...patch } : d)));

  const monday = days.find((d) => d.dayOfWeek === 1);
  const copyMonday = () => {
    if (!monday) return;
    onChange(
      days.map((d) =>
        d.isActive && d.dayOfWeek !== 1
          ? { ...d, startTime: monday.startTime, endTime: monday.endTime, hasBreak: monday.hasBreak, breakStart: monday.breakStart, breakEnd: monday.breakEnd }
          : d
      )
    );
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-2 pb-3">
        <div>
          <CardTitle className="text-base">Weekly working hours</CardTitle>
          <p className="mt-1 text-sm text-slate-600">
            Choose the days you work, your hours, and an optional break. Slots are offered in 30-minute steps.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={copyMonday}>
          <Copy aria-hidden="true" /> Copy Monday to working days
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {days.map((d) => {
          const p = `${idPrefix}-d${d.dayOfWeek}`;
          const e = (field: string) => errors[`day.${d.dayOfWeek}.${field}`];
          const rowErrors = [e("startTime"), e("endTime"), e("breakStart"), e("breakEnd")].filter(Boolean);
          return (
            <fieldset
              key={d.dayOfWeek}
              className={cn(
                "rounded-xl border p-3 transition-colors sm:p-4",
                d.isActive ? "border-border bg-white" : "border-dashed bg-slate-50"
              )}
            >
              <legend className="sr-only">{DAY_NAMES[d.dayOfWeek]}</legend>
              <div className="grid items-end gap-3 sm:grid-cols-[10rem_1fr]">
                <ToggleSwitch
                  checked={d.isActive}
                  onCheckedChange={(v) => update(d.dayOfWeek, { isActive: v })}
                  label={DAY_NAMES[d.dayOfWeek]}
                  description={d.isActive ? "Working" : "Day off"}
                />
                <div className={cn("grid grid-cols-2 gap-3 sm:grid-cols-4", !d.isActive && "opacity-50")}>
                  <TimeField id={`${p}-start`} label="Start" value={d.startTime} disabled={!d.isActive} error={e("startTime")} onChange={(v) => update(d.dayOfWeek, { startTime: v })} />
                  <TimeField id={`${p}-end`} label="End" value={d.endTime} disabled={!d.isActive} error={e("endTime")} onChange={(v) => update(d.dayOfWeek, { endTime: v })} />
                  {d.hasBreak ? (
                    <>
                      <TimeField id={`${p}-bs`} label="Break from" value={d.breakStart} disabled={!d.isActive} error={e("breakStart")} onChange={(v) => update(d.dayOfWeek, { breakStart: v })} />
                      <TimeField id={`${p}-be`} label="Break to" value={d.breakEnd} disabled={!d.isActive} error={e("breakEnd")} onChange={(v) => update(d.dayOfWeek, { breakEnd: v })} />
                    </>
                  ) : (
                    <p className="col-span-2 self-center text-xs text-slate-600">No break</p>
                  )}
                </div>
              </div>
              <div className={cn("mt-3 flex items-center gap-2", !d.isActive && "opacity-50")}>
                <Checkbox
                  id={`${p}-hasbreak`}
                  checked={d.hasBreak}
                  disabled={!d.isActive}
                  onCheckedChange={(v) => update(d.dayOfWeek, { hasBreak: v === true })}
                />
                <Label htmlFor={`${p}-hasbreak`} className="text-xs font-normal text-slate-700">
                  Take a break on {DAY_NAMES[d.dayOfWeek]}s
                </Label>
              </div>
              {rowErrors.length > 0 && (
                <ul role="alert" className="mt-2 space-y-0.5 text-xs text-red-700">
                  {FIELDS.map(
                    ([field, suffix]) =>
                      e(field) && (
                        <li key={field} id={`${p}-${suffix}-err`}>
                          {DAY_NAMES[d.dayOfWeek]}: {e(field)}
                        </li>
                      )
                  )}
                </ul>
              )}
            </fieldset>
          );
        })}
      </CardContent>
    </Card>
  );
}
