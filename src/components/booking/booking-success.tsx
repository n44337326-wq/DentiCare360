"use client";

import { forwardRef } from "react";
import Link from "next/link";
import { CalendarPlus, CircleCheck, Clock3, Video } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { cn, formatCurrency } from "@/lib/utils";
import type { Appointment } from "@/types";
import type { BookingDoctor } from "@/components/booking/types";
import { buildIcs, downloadIcs } from "@/components/booking/calendar-ics";

/** Success screen. The heading takes focus so the result is announced. */
export const BookingSuccess = forwardRef<
  HTMLHeadingElement,
  { appointment: Appointment; doctor: BookingDoctor | null; onBookAnother: () => void }
>(function BookingSuccess({ appointment, doctor, onBookAnother }, headingRef) {
  const confirmed = appointment.status === "CONFIRMED";
  const online = appointment.consultationType === "ONLINE";
  const location = online ? "Online consultation" : (doctor?.location ?? "DentiCare360 clinic");

  const addToCalendar = () => {
    const ics = buildIcs({
      uid: appointment.id,
      title: `${appointment.serviceName} with ${appointment.doctorName}`,
      date: appointment.date,
      startTime: appointment.startTime,
      endTime: appointment.endTime,
      location,
      description: online ? "Online visit — open your DentiCare360 patient portal to join." : "DentiCare360 appointment.",
    });
    downloadIcs("denticare360-appointment.ics", ics);
  };

  const details: [string, string][] = [
    ["Doctor", appointment.doctorName],
    ["Service", appointment.serviceName],
    ["Date", formatLongDate(appointment.date)],
    ["Time", `${formatTime12(appointment.startTime)} – ${formatTime12(appointment.endTime)}`],
    ["Visit type", online ? "Online video consultation" : "In person"],
    ["Where", location],
  ];

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex flex-col items-center text-center">
        <span className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-light text-green">
          <CircleCheck className="h-9 w-9" aria-hidden="true" />
        </span>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-semibold text-navy focus:outline-none">
          {confirmed ? "Your appointment is confirmed" : "Your request was sent"}
        </h2>
        <p className="mt-2 max-w-md text-slate-700" role="status">
          {confirmed
            ? "We've added it to your appointments and sent you a confirmation."
            : "You'll be notified when the doctor confirms."}
        </p>
        <div className="mt-3">
          <AppointmentStatusBadge status={appointment.status} />
        </div>
      </div>

      <dl className="divide-y divide-border rounded-xl border border-border bg-white px-5">
        {details.map(([label, value]) => (
          <div key={label} className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
            <dt className="text-sm text-slate-600">{label}</dt>
            <dd className="text-sm font-medium text-navy">{value}</dd>
          </div>
        ))}
        <div className="grid gap-1 py-3 sm:grid-cols-[9rem_1fr]">
          <dt className="text-sm text-slate-600">Consultation fee</dt>
          <dd className="text-sm font-medium text-navy">
            {doctor ? formatCurrency(doctor.consultationFee) : "See your payments"} ·{" "}
            <Link href="/patient/payments" className="text-cyan underline-offset-4 hover:underline">
              View payments
            </Link>
          </dd>
        </div>
      </dl>

      {online && (
        <p className="flex gap-2 rounded-lg bg-cyan-light p-3 text-sm text-navy">
          <Video className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          The join link for your online visit is in your patient portal under Appointments.
        </p>
      )}
      {!confirmed && (
        <p className="flex gap-2 rounded-lg bg-soft-blue p-3 text-sm text-navy">
          <Clock3 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          The time is held for you while the doctor reviews your request.
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="button" variant="outline" className="h-11" onClick={addToCalendar}>
          <CalendarPlus /> Add to calendar
        </Button>
        <Link href="/patient/appointments" className={cn(buttonVariants(), "h-11")}>
          View my appointments
        </Link>
        <Link href="/patient/dashboard" className={cn(buttonVariants({ variant: "outline" }), "h-11")}>
          Go to dashboard
        </Link>
        <Button type="button" variant="ghost" className="h-11" onClick={onBookAnother}>
          Book another appointment
        </Button>
      </div>
    </div>
  );
});
