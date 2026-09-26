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
    <section aria-labelledby="featured-heading" className="bg-soft-blue py-16">
      <div className="container-app">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 id="featured-heading" className="text-3xl font-semibold text-navy">
              Featured doctors
            </h2>
            <p className="mt-2 text-navy/75">Highly rated specialists with appointments you can book today.</p>
          </div>
          <Button variant="outline" asChild className="bg-white">
            <Link href="/doctors">
              View all doctors <ArrowRight aria-hidden="true" />
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
