import { CalendarX2 } from "lucide-react";
import type { Appointment } from "@/types";
import { EmptyState } from "@/components/shared/states";
import { AppointmentRow } from "@/components/doctor/appointment-row";

export function AppointmentList({
  appointments,
  role,
  emptyTitle = "No appointments here",
  emptyDescription,
  showDoctor,
  linkPatient,
  highlightPending,
}: {
  appointments: Appointment[];
  role: "DOCTOR" | "ADMIN";
  emptyTitle?: string;
  emptyDescription?: string;
  showDoctor?: boolean;
  linkPatient?: boolean;
  highlightPending?: boolean;
}) {
  if (appointments.length === 0) {
    return <EmptyState icon={CalendarX2} title={emptyTitle} description={emptyDescription} />;
  }
  return (
    <ul className="space-y-3">
      {appointments.map((a) => (
        <li key={a.id}>
          <AppointmentRow
            appointment={a}
            role={role}
            showDoctor={showDoctor}
            linkPatient={linkPatient}
            highlightPending={highlightPending}
          />
        </li>
      ))}
    </ul>
  );
}
