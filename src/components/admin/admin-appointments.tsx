"use client";

import { useMemo, useState } from "react";
import { CalendarX2, FilterX, SearchX } from "lucide-react";
import type { Appointment, AppointmentStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState } from "@/components/shared/states";
import { AppointmentList } from "@/components/doctor/appointment-list";

const ALL = "all";
const PAGE = 25;
const STATUSES: { value: AppointmentStatus; label: string }[] = [
  { value: "PENDING", label: "Awaiting confirmation" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "RESCHEDULED", label: "Rescheduled" },
  { value: "COMPLETED", label: "Completed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "NO_SHOW", label: "No-show" },
];

/** Every appointment with client-side filters (status, doctor, patient search, date range) and admin actions on each. */
export function AdminAppointments({ appointments }: { appointments: Appointment[] }) {
  const [status, setStatus] = useState(ALL);
  const [doctor, setDoctor] = useState(ALL);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [visible, setVisible] = useState(PAGE);

  const doctors = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of appointments) map.set(a.doctorId, a.doctorName);
    return [...map].sort((a, b) => a[1].localeCompare(b[1]));
  }, [appointments]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return appointments.filter(
      (a) =>
        (status === ALL || a.status === status) &&
        (doctor === ALL || a.doctorId === doctor) &&
        (!q || a.patientName.toLowerCase().includes(q)) &&
        (!from || a.date >= from) &&
        (!to || a.date <= to)
    );
  }, [appointments, status, doctor, search, from, to]);

  const filtered = status !== ALL || doctor !== ALL || search || from || to;
  const reset = () => {
    setStatus(ALL);
    setDoctor(ALL);
    setSearch("");
    setFrom("");
    setTo("");
    setVisible(PAGE);
  };
  const onFilter = <T,>(setter: (v: T) => void) => (v: T) => {
    setter(v);
    setVisible(PAGE);
  };

  if (appointments.length === 0) {
    return <EmptyState icon={CalendarX2} title="No appointments yet" description="Bookings from patients will appear here." />;
  }

  return (
    <div className="space-y-5">
      <form
        role="search"
        aria-label="Filter appointments"
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-3 rounded-xl border border-border bg-white p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <div className="space-y-1.5">
          <Label htmlFor="appt-search">Patient</Label>
          <Input id="appt-search" type="search" placeholder="Search by name" value={search} onChange={(e) => onFilter(setSearch)(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-status">Status</Label>
          <Select value={status} onValueChange={onFilter(setStatus)}>
            <SelectTrigger id="appt-status"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All statuses</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-doctor">Doctor</Label>
          <Select value={doctor} onValueChange={onFilter(setDoctor)}>
            <SelectTrigger id="appt-doctor"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All doctors</SelectItem>
              {doctors.map(([id, name]) => (
                <SelectItem key={id} value={id}>{name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-from">From date</Label>
          <Input id="appt-from" type="date" value={from} max={to || undefined} onChange={(e) => onFilter(setFrom)(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="appt-to">To date</Label>
          <Input id="appt-to" type="date" value={to} min={from || undefined} onChange={(e) => onFilter(setTo)(e.target.value)} />
        </div>
      </form>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-slate-600" aria-live="polite">
          {shown.length} appointment{shown.length === 1 ? "" : "s"}
          {filtered ? " match your filters" : ""}
        </p>
        {filtered && (
          <Button variant="ghost" size="sm" onClick={reset}>
            <FilterX aria-hidden="true" /> Clear filters
          </Button>
        )}
      </div>

      {shown.length === 0 ? (
        <EmptyState icon={SearchX} title="No appointments match" description="Try widening the date range or clearing a filter." />
      ) : (
        <>
          <AppointmentList appointments={shown.slice(0, visible)} role="ADMIN" showDoctor />
          {shown.length > visible && (
            <div className="flex justify-center">
              <Button variant="outline" onClick={() => setVisible((v) => v + PAGE)}>
                Show more ({shown.length - visible} remaining)
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
