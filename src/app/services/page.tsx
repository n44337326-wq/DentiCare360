import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, HeartPulse, Smile, Sparkles, Stethoscope, UserRound } from "lucide-react";
import { listServices, listSpecialties } from "@/services/catalog";
import { formatCurrency } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CATEGORY_DETAILS, SERVICES_FAQS } from "@/content/site-content";
import { Faq } from "@/components/content/faq";
import { CategoryInfo } from "@/components/content/category-info";
import { ServicesNav } from "@/components/content/services-nav";
import { ServicesHero } from "@/components/content/services-hero";
import "@/components/content/services.css";

export const metadata: Metadata = {
  title: "Services — DentiCare360",
  description: "Dental, skin and dermatology, and general health services. See durations and starting prices, then book online.",
};

// Services are edited by admins, so read them fresh.
export const dynamic = "force-dynamic";

const CATEGORIES: { id: string; label: string; category: ServiceCategory; blurb: string }[] = [
  { id: "dental", label: "Dental", category: "Dental", blurb: "Checkups, cleanings and restorative or cosmetic dentistry." },
  {
    id: "dermatology",
    label: "Skin & Dermatology",
    category: "Skin & Dermatology",
    blurb: "Medical and cosmetic care for skin, hair and scalp.",
  },
  { id: "general", label: "General Health", category: "General Health", blurb: "Everyday health, children's care and prevention." },
];

export default async function ServicesPage() {
  let services: Service[] | null = null;
  let specialtyNames = new Map<string, string>();
  try {
    const [s, specialties] = await Promise.all([listServices(), listSpecialties()]);
    services = s;
    specialtyNames = new Map(specialties.map((sp) => [sp.slug, sp.name]));
  } catch (error) {
    console.error("[services] failed to load", error);
  }

  const groups = CATEGORIES.map((c) => ({ ...c, items: services?.filter((s) => s.category === c.category) ?? [] })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div className="container-app py-12">
      <ServicesHero services={services?.length} areas={groups.length} />

      {!services ? (
        <ErrorState message="We couldn't load our services just now. Please refresh the page in a moment." />
      ) : groups.length === 0 ? (
        <EmptyState
          icon={Stethoscope}
          title="No services are listed yet"
          description="Please check back soon, or browse our doctors in the meantime."
          action={
            <Button asChild>
              <Link href="/doctors">Find a doctor</Link>
            </Button>
          }
        />
      ) : (
        <>
          <ServicesNav groups={groups.map((g) => ({ id: g.id, label: g.label, count: g.items.length }))} />

          <div className="flex flex-col gap-14">
            {groups.map((g) => (
              <section key={g.id} id={g.id} aria-labelledby={`${g.id}-heading`} className="scroll-mt-40">
                <div className="svc-reveal flex items-center gap-4">
                  <span className="svc-cat-badge">
                    {g.id === "dental" ? (
                      <Smile className="h-6 w-6" aria-hidden="true" />
                    ) : g.id === "dermatology" ? (
                      <Sparkles className="h-6 w-6" aria-hidden="true" />
                    ) : (
                      <HeartPulse className="h-6 w-6" aria-hidden="true" />
                    )}
                  </span>
                  <div>
                    <h2 id={`${g.id}-heading`} className="text-2xl font-black text-navy sm:text-3xl">
                      {g.label}
                    </h2>
                    <p className="mt-0.5 text-navy/75">{g.blurb}</p>
                  </div>
                </div>
                <span aria-hidden="true" className="svc-cat-line" />
                <CategoryInfo detail={CATEGORY_DETAILS[g.category]} />
                <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((s, i) => (
                    <ServiceCard key={s.id} service={s} specialtyName={specialtyNames.get(s.specialtySlug)} index={i} />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-16">
            <Faq id="services-faq" items={SERVICES_FAQS} title="Before you book" description="Answers to common questions about our services and pricing." />
          </div>
        </>
      )}
    </div>
  );
}

function ServiceCard({ service: s, specialtyName, index }: { service: Service; specialtyName?: string; index: number }) {
  return (
    <li
      className="svc-card animate-fade-in-up flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm"
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-navy">{s.name}</h3>
        <p className="shrink-0 rounded-full bg-cyan-light px-2.5 py-0.5 text-xs font-semibold text-navy">
          From {formatCurrency(s.startingPrice)}
        </p>
      </div>
      <p className="mt-2 flex-1 text-sm text-navy/75">{s.description}</p>
      <dl className="mt-4 space-y-1.5 text-sm text-navy/80">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Duration</dt>
          <Clock className="h-4 w-4 text-cyan" aria-hidden="true" />
          <dd>{s.durationMinutes} min</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Suitable specialist</dt>
          <UserRound className="h-4 w-4 text-cyan" aria-hidden="true" />
          <dd>
            {s.suitableSpecialist}
            {specialtyName ? <span className="text-navy/65"> &middot; {specialtyName}</span> : null}
          </dd>
        </div>
      </dl>
      <Button size="sm" asChild className="mt-5">
        <Link href={`/appointments/book?service=${s.slug}`} aria-label={`Book appointment for ${s.name}`}>
          Book appointment <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </li>
  );
}
