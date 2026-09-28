import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DoctorCard, DoctorGrid } from "@/components/doctors/doctor-card";
import { loadDoctorsWithAvailability } from "@/components/doctors/doctor-data";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";

const FEATURED_COUNT = 4;

/** Top-rated doctors. Temporarily unavailable doctors are only used to fill the row when too few are available. */
export async function FeaturedDoctors() {
  let data: Awaited<ReturnType<typeof loadDoctorsWithAvailability>> | null = null;
  try {
    data = await loadDoctorsWithAvailability();
  } catch (error) {
    console.error("[home] failed to load featured doctors", error);
  }

  const featured = data
    ? (() => {
        const ranked = [...data.doctors].sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
        const available = ranked.filter((d) => !d.isTemporarilyUnavailable);
        const rest = ranked.filter((d) => d.isTemporarilyUnavailable);
        return [...available, ...(available.length < FEATURED_COUNT ? rest : [])].slice(0, FEATURED_COUNT);
      })()
    : [];

  return (
    <section aria-labelledby="featured-heading" className="bg-gradient-to-br from-soft-blue via-white to-soft-blue/50 py-20">
      <div className="container-app">
        <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
          <div className="animate-fade-in-up">
            <h2 id="featured-heading" className="text-4xl font-black text-navy">
              Featured doctors
            </h2>
            <p className="mt-3 text-lg text-navy/70">Highly rated specialists with appointments you can book today.</p>
          </div>
          <Button variant="outline" asChild className="bg-white transition-all duration-300 hover:shadow-lg hover:scale-105">
            <Link href="/doctors" className="flex items-center gap-2">
              View all doctors <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        {!data ? (
          <ErrorState message="We couldn't load our doctors just now. Please refresh the page." className="bg-white" />
        ) : featured.length === 0 ? (
          <EmptyState title="No doctors listed yet" description="Please check back soon." />
        ) : (
          <DoctorGrid label="Featured doctors" columns={4}>
            {featured.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} next={data.next.get(doctor.id) ?? null} index={i} />
            ))}
          </DoctorGrid>
        )}
      </div>
    </section>
  );
}
