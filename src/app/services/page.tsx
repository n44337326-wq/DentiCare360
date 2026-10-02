import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, HeartPulse, Smile, Sparkles, Stethoscope, UserRound, type LucideIcon } from "lucide-react";
import { listServices, listSpecialties } from "@/services/catalog";
import { formatCurrency } from "@/lib/utils";
import type { Service, ServiceCategory } from "@/types";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { CATEGORY_DETAILS, SERVICES_FAQS } from "@/content/site-content";
import { FaqTiles } from "@/components/content/faq-tiles";
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
                    <ServiceCard
                      key={s.id}
                      service={s}
                      specialtyName={specialtyNames.get(s.specialtySlug)}
                      index={i}
                      tone={g.id}
                      Icon={g.id === "dental" ? Smile : g.id === "dermatology" ? Sparkles : HeartPulse}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <div className="mt-16">
            <FaqTiles id="services-faq" items={SERVICES_FAQS} title="Before you book" description="Answers to common questions about our services and pricing." />
          </div>
        </>
      )}
    </div>
  );
}

function ServiceCard({
  service: s,
  specialtyName,
  index,
  tone,
  Icon,
}: {
  service: Service;
  specialtyName?: string;
  index: number;
  tone: string;
  Icon: LucideIcon;
}) {
  return (
    <li className="svc-card animate-fade-in-up" data-tone={tone} style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}>
      <span aria-hidden="true" className="svc-card-glow" />

      <div className="relative flex items-start justify-between gap-3">
        <span className="svc-card-icon">
          <Icon className="h-5 w-5" strokeWidth={1.9} aria-hidden="true" />
        </span>
        <p className="svc-price">
          <small>From</small>
          <strong>{formatCurrency(s.startingPrice).replace(/\.00$/, "")}</strong>
        </p>
      </div>

      <h3 className="relative mt-4 text-lg font-black leading-tight text-navy">{s.name}</h3>
      <p className="relative mt-1.5 flex-1 text-sm leading-relaxed text-navy/70">{s.description}</p>

      <dl className="relative mt-4 flex flex-wrap gap-2">
        <div className="svc-meta">
          <dt className="sr-only">Duration</dt>
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          <dd>{s.durationMinutes} min</dd>
        </div>
        <div className="svc-meta">
          <dt className="sr-only">Suitable specialist</dt>
          <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
          <dd>{s.suitableSpecialist}</dd>
        </div>
      </dl>
      {specialtyName ? <p className="relative mt-2 text-xs text-navy/55">{specialtyName}</p> : null}

      <Link href={`/appointments/book?service=${s.slug}`} aria-label={`Book appointment for ${s.name}`} className="svc-book relative mt-5">
        <span>Book appointment</span>
        <span className="svc-book-arrow">
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </Link>
    </li>
  );
}
