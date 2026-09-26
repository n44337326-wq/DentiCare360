import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarClock, Stethoscope, User, Video } from "lucide-react";
import { getSessionUser } from "@/lib/guards";
import { isActiveStatus } from "@/lib/appointment-rules";
import { getAppointmentForUser } from "@/services/appointments";
import { formatLongDate, formatTime12 } from "@/lib/time";
import type { Role } from "@/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { AppointmentStatusBadge } from "@/components/shared/status-badge";
import { ConsultationLobby } from "@/components/patient/consultation-lobby";

export const metadata = { title: "Online consultation — DentiCare360" };
export const dynamic = "force-dynamic";

const BACK: Record<Role, { href: string; label: string }> = {
  PATIENT: { href: "/patient/appointments", label: "Back to my appointments" },
  DOCTOR: { href: "/doctor/appointments", label: "Back to appointments" },
  ADMIN: { href: "/admin/appointments", label: "Back to appointments" },
};

export default async function ConsultationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getSessionUser();
  if (!user) redirect(`/login?callbackUrl=${encodeURIComponent(`/consultation/${id}`)}`);

  // Same response for "missing" and "not yours" so ids cannot be probed.
  const appointment = await getAppointmentForUser(user, id).catch(() => null);
  if (!appointment) notFound();

  const back = BACK[user.role];
  const joinable = appointment.consultationType === "ONLINE" && isActiveStatus(appointment.status);
  const counterpart = user.role === "DOCTOR" ? appointment.patientName : appointment.doctorName;

  return (
    <div className="container-app max-w-4xl py-8 lg:py-10">
      <Link
        href={back.href}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> {back.label}
      </Link>

      <h1 className="text-2xl font-semibold text-navy">Online consultation</h1>

      {!joinable ? (
        <div className="mt-6">
          <EmptyState
            icon={Video}
            title={appointment.consultationType !== "ONLINE" ? "This is an in-person appointment" : "This consultation is no longer available"}
            description={
              appointment.consultationType !== "ONLINE"
                ? "Only online consultations have a video lobby. Please visit the clinic at your appointment time."
                : `This appointment is ${appointment.status.toLowerCase().replace("_", " ")}, so it can't be joined.`
            }
            action={
              <Button asChild>
                <Link href={back.href}>{back.label}</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_20rem]">
          <section aria-labelledby="lobby-heading">
            <h2 id="lobby-heading" className="mb-3 text-lg font-semibold text-navy">
              Check your camera and microphone
            </h2>
            <ConsultationLobby counterpart={counterpart} />
          </section>

          <aside aria-label="Appointment details">
            <Card>
              <CardContent className="space-y-4 p-5 text-sm">
                <AppointmentStatusBadge status={appointment.status} />
                <p className="flex items-start gap-2 text-navy">
                  <Stethoscope className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{appointment.doctorName}</span>
                    <span className="text-muted">{appointment.serviceName}</span>
                  </span>
                </p>
                <p className="flex items-start gap-2 text-navy">
                  <User className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{appointment.patientName}</span>
                    <span className="text-muted">Patient</span>
                  </span>
                </p>
                <p className="flex items-start gap-2 text-navy">
                  <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
                  <span>
                    <span className="block font-medium">{formatLongDate(appointment.date)}</span>
                    <span className="text-muted">
                      {formatTime12(appointment.startTime)} – {formatTime12(appointment.endTime)}
                    </span>
                  </span>
                </p>
              </CardContent>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
