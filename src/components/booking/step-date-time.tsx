"use client";

import { Button } from "@/components/ui/button";
import { EmptyState, InlineAlert } from "@/components/shared/states";
import { DateStrip, TimeSlots, type SlotSelection } from "@/components/shared/slot-picker";
import { formatLongDate, formatTime12 } from "@/lib/time";
import type { BookingDoctor } from "@/components/booking/types";

function NeedDoctor({ onPick }: { onPick: () => void }) {
  return <EmptyState title="Choose a doctor first" description="Availability depends on the doctor you pick." action={<Button onClick={onPick}>Choose a doctor</Button>} />;
}

export function StepDate({
  doctor,
  date,
  refreshKey,
  onSelect,
  onPickDoctor,
}: {
  doctor: BookingDoctor | null;
  date: string | null;
  refreshKey: number;
  onSelect: (date: string) => void;
  onPickDoctor: () => void;
}) {
  if (!doctor) return <NeedDoctor onPick={onPickDoctor} />;
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600">
        Showing the next three weeks for <strong className="text-navy">{doctor.name}</strong>. Dimmed days have no openings.
      </p>
      <DateStrip key={`${doctor.id}-${refreshKey}`} doctorId={doctor.id} value={date} onChange={onSelect} />
      {date && (
        <p role="status" className="text-sm text-navy">
          Selected: <strong>{formatLongDate(date)}</strong>
        </p>
      )}
    </div>
  );
}

export function StepTime({
  doctor,
  date,
  startTime,
  slotWarning,
  refreshKey,
  onSelect,
  onChangeDate,
  onPickDoctor,
}: {
  doctor: BookingDoctor | null;
  date: string | null;
  startTime: string | null;
  slotWarning: string | null;
  refreshKey: number;
  onSelect: (selection: SlotSelection) => void;
  onChangeDate: () => void;
  onPickDoctor: () => void;
}) {
  if (!doctor) return <NeedDoctor onPick={onPickDoctor} />;
  if (!date) {
    return <EmptyState title="Pick a date first" description="Times are shown for one day at a time." action={<Button onClick={onChangeDate}>Pick a date</Button>} />;
  }
  return (
    <div className="space-y-4">
      {slotWarning && <InlineAlert variant="warning" title="Please choose another time">{slotWarning}</InlineAlert>}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600">
          Times on <strong className="text-navy">{formatLongDate(date)}</strong> with {doctor.name}
        </p>
        <Button type="button" variant="outline" size="sm" className="h-9" onClick={onChangeDate}>
          Change date
        </Button>
      </div>
      <TimeSlots key={`${doctor.id}-${date}-${refreshKey}`} doctorId={doctor.id} date={date} value={startTime} onChange={onSelect} />
      {startTime && (
        <p role="status" className="text-sm text-navy">
          Selected: <strong>{formatTime12(startTime)}</strong> on <strong>{formatLongDate(date)}</strong>
        </p>
      )}
    </div>
  );
}
