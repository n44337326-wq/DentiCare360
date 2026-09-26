import Link from "next/link";
import { SPECIALTY_DETAILS } from "@/content/site-content";

/** "Which specialist should I see?" — what each kind of doctor treats and what a first visit involves. */
export function SpecialistGuide({ specialties }: { specialties: { slug: string; name: string }[] }) {
  const items = specialties.filter((s) => SPECIALTY_DETAILS[s.slug]);
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="guide-heading" className="mt-16">
      <div className="max-w-2xl">
        <h2 id="guide-heading" className="text-2xl font-semibold text-navy">
          Which specialist should I see?
        </h2>
        <p className="mt-1.5 text-navy/75">
          A quick guide to what each type of doctor helps with. Still unsure? The{" "}
          <Link href="/ai-assistant" className="font-medium text-cyan underline-offset-4 hover:underline">
            AI Health Assistant
          </Link>{" "}
          can suggest one — it never diagnoses.
        </p>
      </div>
      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {items.map((s) => {
          const d = SPECIALTY_DETAILS[s.slug];
          return (
            <li key={s.slug} className="rounded-xl border border-border bg-white p-5 shadow-sm">
              <h3 className="font-semibold text-navy">{s.name}</h3>
              <p className="mt-1 text-sm text-navy/80">{d.tagline}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-navy/60">Often seen for</p>
              <p className="mt-1 text-sm text-navy/80">{d.treats.join(" · ")}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-navy/60">Your first visit</p>
              <p className="mt-1 text-sm text-navy/80">{d.firstVisit}</p>
              <Link
                href={`/doctors?specialty=${s.slug}`}
                className="mt-4 inline-block text-sm font-medium text-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                Show {s.name} doctors
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
