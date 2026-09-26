import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  CalendarCheck,
  CalendarClock,
  GraduationCap,
  Languages,
  MapPin,
  Monitor,
  Star,
  Wallet,
} from "lucide-react";
import { getActiveDoctor } from "@/services/catalog";
import { getBookedSlots } from "@/services/scheduling";
import { findNextAvailableDates, generateSlotsForDate } from "@/lib/availability";
import { addDays, clinicNow, formatShortDate } from "@/lib/time";
import { formatCurrency } from "@/lib/utils";
import { nextSlotLabel } from "@/components/doctors/doctor-card";
import { UpcomingSlots, WeeklyAvailability, type UpcomingDay } from "@/components/doctors/doctor-schedule";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { ErrorState, InlineAlert } from "@/components/shared/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

// Live availability: never serve a stale slot list.
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { id } = await params;
  try {
    const doctor = await getActiveDoctor(id);
    if (doctor) {
      return {
        title: `${doctor.name} — ${doctor.specialtyName} | DentiCare360`,
        description: `${doctor.name}, ${doctor.specialtyName} with ${doctor.experienceYears} years of experience. View availability and book an appointment.`,
      };
    }
  } catch {
    // fall through to the generic title
  }
  return { title: "Doctor profile — DentiCare360" };
}

const MAX_TIMES_PER_DAY = 10;

async function loadUpcoming(doctor: NonNullable<Awaited<ReturnType<typeof getActiveDoctor>>>) {
  const now = clinicNow();
  const booked = await getBookedSlots([doctor.id], now.dateISO, addDays(now.dateISO, 60));
  const byDate = booked.get(doctor.id) ?? new Map<string, Set<string>>();
  const open = findNextAvailableDates(doctor, byDate, now, { count: 5, daysToScan: 60 });
  const days: UpcomingDay[] = open.map(({ date }) => ({
    date,
    times: generateSlotsForDate(doctor, date, byDate.get(date), now)
      .filter((s) => !s.isBooked)
      .map((s) => s.startTime),
  }));
  return { today: now.dateISO, days, next: open[0] ?? null };
}

export default async function DoctorProfilePage({ params }: Params) {
  const { id } = await params;
  const doctor = await getActiveDoctor(id);
  if (!doctor) notFound();

  let upcoming: Awaited<ReturnType<typeof loadUpcoming>> | null = null;
  try {
    upcoming = await loadUpcoming(doctor);
  } catch (error) {
    console.error("[doctor profile] failed to load slots", error);
  }

  const today = upcoming?.today ?? clinicNow().dateISO;
  const blockedToday = doctor.blockedDates.find((b) => b.date === today);
  const upcomingBlocks = doctor.blockedDates.filter((b) => b.date > today).slice(0, 5);
  const next = upcoming?.next ?? null;
  const bookHref = `/appointments/book?doctor=${doctor.id}`;

  return (
    <div className="container-app py-10">
      <Link
        href="/doctors"
        className="mb-6 inline-flex items-center gap-1.5 rounded text-sm font-medium text-navy/80 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All doctors
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="flex min-w-0 flex-col gap-8">
          <Card className="animate-fade-in-up p-6">
            <div className="flex flex-wrap items-start gap-5">
              <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="xl" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold text-navy sm:text-3xl">{doctor.name}</h1>
                <p className="mt-1 text-navy/75">{doctor.specialtyName}</p>
                <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-navy">
                  <span className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-500" aria-hidden="true" />
                    <span className="font-medium">{doctor.rating.toFixed(1)}</span>
                    <span className="text-navy/75">({doctor.reviewCount} reviews)</span>
                  </span>
                  <span>{doctor.experienceYears} years experience</span>
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {doctor.isTemporarilyUnavailable ? (
                    <Badge variant="warning" className="text-amber-900">
                      Currently unavailable
                    </Badge>
                  ) : (
                    <Badge variant="success" className="text-emerald-800">
                      Accepting appointments
                    </Badge>
                  )}
                  {doctor.supportsInPerson && (
                    <Badge variant="default">
                      <Building2 className="h-3 w-3" aria-hidden="true" /> In-person
                    </Badge>
                  )}
                  {doctor.supportsOnline && (
                    <Badge variant="default">
                      <Monitor className="h-3 w-3" aria-hidden="true" /> Online
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <Button size="lg" asChild className="w-full sm:w-auto">
                <Link href={bookHref}>
                  <CalendarCheck aria-hidden="true" /> Book appointment
                </Link>
              </Button>
            </div>
          </Card>

          {doctor.isTemporarilyUnavailable && (
            <InlineAlert variant="warning" title={`${doctor.name} is currently unavailable`}>
              {doctor.unavailableReason ? <p>{doctor.unavailableReason}</p> : null}
              <p>Booking is paused until the doctor is available again. You can choose another doctor in the meantime.</p>
            </InlineAlert>
          )}
          {!doctor.isTemporarilyUnavailable && blockedToday && (
            <InlineAlert variant="warning" title={`${doctor.name} is unavailable today`}>
              {blockedToday.reason ? <p>{blockedToday.reason}</p> : null}
              {next && <p>Next available: {nextSlotLabel(next)}.</p>}
            </InlineAlert>
          )}

          <section aria-labelledby="about-heading">
            <h2 id="about-heading" className="text-xl font-semibold text-navy">
              About {doctor.name}
            </h2>
            <p className="mt-3 leading-relaxed text-navy/85">{doctor.bio}</p>
          </section>

          <section aria-labelledby="expertise-heading">
            <h2 id="expertise-heading" className="text-xl font-semibold text-navy">
              Areas of expertise
            </h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {doctor.areasOfExpertise.map((area) => (
                <li key={area}>
                  <Badge variant="cyan" className="px-3 py-1 text-sm text-navy">
                    {area}
                  </Badge>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="details-heading">
            <h2 id="details-heading" className="sr-only">
              Doctor details
            </h2>
            <dl className="grid gap-5 rounded-xl border border-border bg-white p-6 sm:grid-cols-2">
              <Detail icon={GraduationCap} label="Qualifications">
                <ul className="space-y-0.5">
                  {doctor.qualifications.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </Detail>
              <Detail icon={Languages} label="Languages">
                {doctor.languages.join(", ")}
              </Detail>
              <Detail icon={MapPin} label="Location">
                {doctor.location}
              </Detail>
              <Detail icon={Wallet} label="Consultation fee">
                {formatCurrency(doctor.consultationFee)}
              </Detail>
            </dl>
          </section>

          <section aria-labelledby="slots-heading">
            <h2 id="slots-heading" className="flex items-center gap-2 text-xl font-semibold text-navy">
              <CalendarClock className="h-5 w-5 text-cyan" aria-hidden="true" /> Upcoming appointment slots
            </h2>
            <p className="mt-1 text-sm text-navy/75">Choose a time to continue to booking.</p>
            <div className="mt-4">
              {upcoming ? (
                <UpcomingSlots
                  doctorId={doctor.id}
                  days={upcoming.days.map((d) => ({ ...d, times: d.times.slice(0, MAX_TIMES_PER_DAY) }))}
                />
              ) : (
                <ErrorState message="We couldn't load this doctor's availability. Please refresh the page." />
              )}
              {upcoming?.days.some((d) => d.times.length > MAX_TIMES_PER_DAY) && (
                <p className="mt-4 text-sm text-navy/75">
                  More times are available on some days &mdash;{" "}
                  <Link href={bookHref} className="font-medium text-navy underline underline-offset-2">
                    see them all when booking
                  </Link>
                  .
                </p>
              )}
              {upcomingBlocks.length > 0 && (
                <p className="mt-4 text-sm text-navy/75">
                  Not available on:{" "}
                  {upcomingBlocks.map((b) => `${formatShortDate(b.date)}${b.reason ? ` (${b.reason})` : ""}`).join(", ")}.
                </p>
              )}
            </div>
          </section>
        </div>

        <aside className="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start" aria-label="Booking and schedule">
          <Card className="p-6">
            <p className="text-sm text-navy/75">Consultation fee</p>
            <p className="text-2xl font-semibold text-navy">{formatCurrency(doctor.consultationFee)}</p>
            <p className="mt-3 text-sm text-navy">
              {doctor.isTemporarilyUnavailable
                ? "Currently unavailable"
                : next
                  ? `Next available: ${nextSlotLabel(next)}`
                  : "No open slots right now"}
            </p>
            <Button className="mt-4 w-full" asChild>
              <Link href={bookHref}>Book appointment</Link>
            </Button>
          </Card>

          <Card className="p-6">
            <h2 className="mb-1 font-semibold text-navy">Weekly availability</h2>
            <WeeklyAvailability availability={doctor.availability} />
          </Card>
        </aside>
      </div>
    </div>
  );
}

function Detail({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-light text-navy">
        <Icon className="h-4 w-4" />
      </span>
      <div className="text-sm">
        <dt className="font-medium text-navy">{label}</dt>
        <dd className="mt-0.5 text-navy/80">{children}</dd>
      </div>
    </div>
  );
}
