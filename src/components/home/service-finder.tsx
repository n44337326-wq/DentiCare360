import { listSpecialties } from "@/services/catalog";
import { FINDER_COPY } from "@/content/finder-copy";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { FinderGrid } from "@/components/home/finder-grid";
import "./service-finder.css";

/** Quick Service Finder: one card per specialty, straight into the filtered doctor list. */
export async function ServiceFinder() {
  let specialties: Awaited<ReturnType<typeof listSpecialties>> | null = null;
  try {
    specialties = await listSpecialties();
  } catch (error) {
    console.error("[home] failed to load specialties", error);
  }

  const header = (
    <div className="finder-reveal mx-auto mb-12 max-w-2xl text-center">
      <h2 id="finder-heading" className="text-3xl font-semibold text-navy sm:text-4xl">
        Find the right care, fast
      </h2>
      <span aria-hidden="true" className="finder-bar" />
      <p className="mt-4 text-navy/75">Choose an area of care. Not sure? Ask our AI Health Assistant.</p>
    </div>
  );

  return (
    <section aria-labelledby="finder-heading" className="relative overflow-hidden py-20">
      <div aria-hidden="true" className="finder-dots" />
      <div aria-hidden="true" className="finder-orb finder-orb-a" />
      <div aria-hidden="true" className="finder-orb finder-orb-b" />

      <div className="container-app relative">
        {!specialties ? (
          <>
            {header}
            <ErrorState message="We couldn't load our specialties just now. Please refresh the page." />
          </>
        ) : specialties.length === 0 ? (
          <>
            {header}
            <EmptyState title="No specialties available yet" description="Please check back soon." />
          </>
        ) : (
          <FinderGrid
            header={header}
            items={specialties.map((s) => ({
              id: s.id,
              slug: s.slug,
              name: s.name,
              icon: s.icon,
              text: FINDER_COPY[s.slug] ?? s.description,
            }))}
          />
        )}
      </div>
    </section>
  );
}
