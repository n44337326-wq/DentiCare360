import type { Metadata } from "next";
import Link from "next/link";
import { SearchX } from "lucide-react";
import { clinicToday } from "@/lib/time";
import { listSpecialties } from "@/services/catalog";
import { DoctorCard, DoctorGrid } from "@/components/doctors/doctor-card";
import { loadDoctorsWithAvailability } from "@/components/doctors/doctor-data";
import { DoctorFilters } from "@/components/doctors/doctor-filters";
import {
  deriveFilterOptions,
  filterDoctors,
  hasActiveFilters,
  parseDoctorFilters,
} from "@/components/doctors/doctor-search";
import { Button } from "@/components/ui/button";
import { Faq } from "@/components/content/faq";
import { SpecialistGuide } from "@/components/content/specialist-guide";
import { DOCTORS_FAQS } from "@/content/site-content";
import { EmptyState, ErrorState } from "@/components/shared/states";

export const metadata: Metadata = {
  title: "Find a Doctor — DentiCare360",
  description: "Browse verified dentists, dermatologists and general physicians. Filter by specialty, availability, language and more.",
};

// Availability changes with every booking, so this page is never cached.
export const dynamic = "force-dynamic";

export default async function DoctorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseDoctorFilters(await searchParams);

  let data: Awaited<ReturnType<typeof loadDoctorsWithAvailability>> | null = null;
  let specialties: Awaited<ReturnType<typeof listSpecialties>> = [];
  try {
    [data, specialties] = await Promise.all([loadDoctorsWithAvailability(), listSpecialties()]);
  } catch (error) {
    console.error("[doctors] failed to load", error);
  }

  return (
    <div className="container-app py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold text-navy sm:text-4xl">Find a Doctor</h1>
        <p className="mt-3 text-navy/75">
          Browse verified specialists across dental, dermatology and general health, then book the time that suits you.
        </p>
      </header>

      {!data ? (
        <ErrorState message="We couldn't load our doctors just now. Please refresh the page in a moment." />
      ) : (
        <DoctorResults data={data} specialties={specialties} filters={filters} />
      )}
    </div>
  );
}

function DoctorResults({
  data,
  specialties,
  filters,
}: {
  data: NonNullable<Awaited<ReturnType<typeof loadDoctorsWithAvailability>>>;
  specialties: Awaited<ReturnType<typeof listSpecialties>>;
  filters: ReturnType<typeof parseDoctorFilters>;
}) {
  const results = filterDoctors(data.doctors, data.next, filters, clinicToday());
  const { locations, languages } = deriveFilterOptions(data.doctors);

  return (
    <>
      <DoctorFilters
        specialties={specialties.map((s) => ({ value: s.slug, label: s.name }))}
        locations={locations}
        languages={languages}
        resultCount={results.length}
        totalCount={data.doctors.length}
      />

      <div className="mt-8">
        {results.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No doctors match these filters"
            description={
              hasActiveFilters(filters)
                ? "Try removing a filter or widening your search."
                : "There are no doctors to show right now. Please check back soon."
            }
            action={
              hasActiveFilters(filters) ? (
                <Button variant="outline" asChild>
                  <Link href="/doctors">Clear filters</Link>
                </Button>
              ) : undefined
            }
          />
        ) : (
          <DoctorGrid label="Doctors">
            {results.map((doctor, i) => (
              <DoctorCard key={doctor.id} doctor={doctor} next={data.next.get(doctor.id) ?? null} index={i} />
            ))}
          </DoctorGrid>
        )}
      </div>

      <SpecialistGuide specialties={specialties.map((sp) => ({ slug: sp.slug, name: sp.name }))} />
      <div className="mt-16">
        <Faq id="doctors-faq" items={DOCTORS_FAQS} title="Choosing a doctor" />
      </div>
    </>
  );
}
