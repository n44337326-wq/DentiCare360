import Link from "next/link";
import { CalendarClock, CalendarPlus, Star } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { formatLongDate, formatTime12 } from "@/lib/time";
import { cn, formatCurrency } from "@/lib/utils";
import type { RecommendationCard as Recommendation } from "@/services/ai";

type RecommendedDoctor = Recommendation["doctors"][number];

const bookHref = (rec: Recommendation, doctor: RecommendedDoctor, conversationId: string | null) => {
  const params = new URLSearchParams({ doctor: doctor.id });
  if (rec.service) params.set("service", rec.service.slug);
  if (conversationId) params.set("conversation", conversationId);
  if (doctor.nextAvailable) {
    params.set("date", doctor.nextAvailable.date);
    params.set("time", doctor.nextAvailable.startTime);
  }
  return `/appointments/book?${params.toString()}`;
};

/** Suggested specialist, service and the doctors with the soonest openings. */
export function RecommendationCard({ recommendation, conversationId }: { recommendation: Recommendation; conversationId: string | null }) {
  const doctors = recommendation.doctors.slice(0, 3);
  const anyAvailability = doctors.some((d) => d.nextAvailable);
  const generalParams = new URLSearchParams({ specialty: recommendation.specialty.slug });
  if (conversationId) generalParams.set("conversation", conversationId);

  return (
    <section aria-labelledby="recommendation-heading" className="ml-10 rounded-xl border border-cyan/30 bg-white p-4 shadow-sm animate-fade-in-up sm:ml-10">
      <p className="text-xs font-semibold uppercase tracking-wide text-cyan">Suggested next step</p>
      <h3 id="recommendation-heading" className="mt-1 text-base font-semibold text-navy">
        {recommendation.specialty.name} consultation
      </h3>
      {recommendation.service && (
        <p className="mt-0.5 text-sm text-slate-700">
          {recommendation.service.name} · <span className="font-medium">from {formatCurrency(recommendation.service.startingPrice)}</span>
        </p>
      )}

      {doctors.length > 0 ? (
        <>
          {!anyAvailability && (
            <p role="status" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
              No appointments are open in the next few weeks for these doctors. You can still start a booking to see the latest availability.
            </p>
          )}
          <ul className="mt-3 divide-y divide-border">
            {doctors.map((doctor) => (
              <li key={doctor.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0">
                <DoctorAvatar name={doctor.name} photoUrl={doctor.photoUrl} size="md" />
                <div className="min-w-0 flex-1 basis-40">
                  <p className="font-medium text-navy">{doctor.name}</p>
                  <p className="flex flex-wrap items-center gap-x-2 text-xs text-slate-700">
                    <span className="inline-flex items-center gap-1" aria-label={`Rated ${doctor.rating.toFixed(1)} out of 5`}>
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
                      {doctor.rating.toFixed(1)}
                    </span>
                    <span>{formatCurrency(doctor.consultationFee)} / visit</span>
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-xs text-navy">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {doctor.nextAvailable
                      ? `Next available: ${formatLongDate(doctor.nextAvailable.date)}, ${formatTime12(doctor.nextAvailable.startTime)}`
                      : "No openings right now"}
                  </p>
                </div>
                <Link
                  href={bookHref(recommendation, doctor, conversationId)}
                  aria-label={`Book with ${doctor.name}`}
                  className={cn(buttonVariants({ size: "sm" }), "h-11 px-5")}
                >
                  Book
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p role="status" className="mt-3 rounded-lg bg-soft-blue p-3 text-sm text-navy">
          We couldn&apos;t find a doctor with open appointments for this right now. Please check back soon.
        </p>
      )}

      <Link
        href={`/appointments/book?${generalParams.toString()}`}
        className={cn(buttonVariants({ variant: "outline" }), "mt-3 h-11 w-full sm:w-auto")}
      >
        <CalendarPlus /> Book an appointment
      </Link>
    </section>
  );
}
