"use client";

import { useState } from "react";
import { CalendarOff, Plus, Trash2 } from "lucide-react";
import type { BlockedDate, BlockKind } from "@/types";
import { clinicToday, formatLongDate } from "@/lib/time";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/states";
import { KIND_LABEL } from "@/components/doctor/availability-model";

/** Holidays, leave and blocked dates. The add control only accepts today or later. */
export function BlockedDatesEditor({
  value,
  onChange,
  error,
  idPrefix,
}: {
  value: BlockedDate[];
  onChange: (next: BlockedDate[]) => void;
  error?: string;
  idPrefix: string;
}) {
  const [today] = useState(() => clinicToday());
  const [date, setDate] = useState("");
  const [kind, setKind] = useState<BlockKind>("HOLIDAY");
  const [reason, setReason] = useState("");
  const [addError, setAddError] = useState<string | null>(null);

  function add() {
    if (!date) return setAddError("Choose a date.");
    if (date < today) return setAddError("Choose today or a future date.");
    if (value.some((b) => b.date === date)) return setAddError("That date is already in your list.");
    setAddError(null);
    onChange([...value, { date, kind, ...(reason.trim() ? { reason: reason.trim() } : {}) }].sort((a, b) => a.date.localeCompare(b.date)));
    setDate("");
    setReason("");
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Holidays, leave and blocked dates</CardTitle>
        <p className="text-sm text-slate-600">
          Patients cannot book these days. Existing appointments on a newly blocked day are not cancelled — those patients are
          notified so they can reschedule.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-[11rem_9rem_1fr_auto] sm:items-end">
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-bd-date`}>Date</Label>
            <Input
              id={`${idPrefix}-bd-date`}
              type="date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!!addError}
              aria-describedby={addError ? `${idPrefix}-bd-err` : undefined}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-bd-kind`}>Type</Label>
            <Select value={kind} onValueChange={(v) => setKind(v as BlockKind)}>
              <SelectTrigger id={`${idPrefix}-bd-kind`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(KIND_LABEL) as BlockKind[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {KIND_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${idPrefix}-bd-reason`}>Reason (optional)</Label>
            <Input
              id={`${idPrefix}-bd-reason`}
              value={reason}
              maxLength={200}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Public holiday"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  add();
                }
              }}
            />
          </div>
          <Button type="button" variant="outline" onClick={add}>
            <Plus aria-hidden="true" /> Add date
          </Button>
        </div>
        {addError && (
          <p id={`${idPrefix}-bd-err`} role="alert" className="-mt-2 text-xs text-red-700">
            {addError}
          </p>
        )}
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}

        {value.length === 0 ? (
          <EmptyState icon={CalendarOff} title="No blocked dates" description="Add a holiday or period of leave and it will appear here." />
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {value.map((b) => {
              const past = b.date < today;
              return (
                <li key={b.date} className={`flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 ${past ? "opacity-60" : ""}`}>
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="text-sm font-medium text-navy">{formatLongDate(b.date)}</p>
                    {b.reason && <p className="truncate text-xs text-slate-600">{b.reason}</p>}
                  </div>
                  <Badge variant={b.kind === "HOLIDAY" ? "cyan" : b.kind === "LEAVE" ? "warning" : "default"}>{KIND_LABEL[b.kind]}</Badge>
                  {past && <Badge variant="outline">Past</Badge>}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-red-700 hover:bg-red-50"
                    onClick={() => onChange(value.filter((x) => x.date !== b.date))}
                    aria-label={`Remove ${KIND_LABEL[b.kind].toLowerCase()} on ${formatLongDate(b.date)}`}
                  >
                    <Trash2 aria-hidden="true" /> Remove
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
