import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, CalendarClock, HeartHandshake, Layers, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Faq } from "@/components/content/faq";
import { HowItWorks } from "@/components/content/how-it-works";
import { GENERAL_FAQS, SPECIALTY_DETAILS } from "@/content/site-content";
import { listDoctors, listServices, listSpecialties } from "@/services/catalog";

export const metadata: Metadata = {
  title: "About — DentiCare360",
  description: "DentiCare360 brings dental, dermatology and everyday healthcare together on one secure platform.",
};

export const dynamic = "force-dynamic";

const PRINCIPLES = [
  { icon: Layers, title: "One trusted clinic", desc: "Dental, skin and general health in one place, so related care isn't scattered across separate clinics and websites." },
  { icon: BadgeCheck, title: "Verified care", desc: "Every doctor on the platform is credential-checked before they can accept appointments." },
  { icon: HeartHandshake, title: "Human-led", desc: "Licensed clinicians make every medical decision. Technology is there to remove friction, not replace judgement." },
  { icon: Sparkles, title: "AI that knows its limits", desc: "Our AI Health Assistant helps you find the right specialist. It never diagnoses, prescribes or replaces a consultation." },
  { icon: CalendarClock, title: "Honest availability", desc: "You only see times that are genuinely open, and you're told plainly when a doctor is away." },
  { icon: LockKeyhole, title: "Private by design", desc: "Patient records are access-controlled by role, and access to them is logged." },
];

async function loadNumbers() {
  try {
    const [doctors, services, specialties] = await Promise.all([listDoctors(), listServices(), listSpecialties()]);
    const languages = new Set(doctors.flatMap((d) => d.languages));
    return { doctors, services: services.length, specialties, languages: languages.size };
  } catch (error) {
    console.error("[about] failed to load numbers", error);
    return null;
  }
}

export default async function AboutPage() {
  const data = await loadNumbers();

  return (
    <div className="container-app py-12">
      <header className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-navy sm:text-4xl">About DentiCare360</h1>
        <p className="mt-4 text-lg text-navy/80">
          DentiCare360 brings dental, dermatology and everyday healthcare together on one secure platform, so patients
          never have to juggle separate clinics and separate websites for related care.
        </p>
      </header>

      <section aria-labelledby="story-heading" className="mx-auto mt-12 max-w-3xl">
        <h2 id="story-heading" className="text-2xl font-semibold text-navy">
          Our story
        </h2>
        <div className="mt-3 space-y-3 text-navy/80">
          <p>
            Getting care often means a dentist&apos;s website for your teeth, a different clinic for your skin, and yet
            another portal for a general check-up — each with its own login, its own forms and its own records.
          </p>
          <p>
            We built DentiCare360 around a simple idea: one clinic, one account. You can find the right professional,
            see when they are genuinely free, book in a minute, and keep your appointments, documents and invoices in
            one secure place.
          </p>
          <p>
            Technology handles the paperwork and the scheduling. Doctors handle the medicine. That is why our AI
            Health Assistant is designed to guide you to the right person — never to diagnose or prescribe.
          </p>
        </div>
      </section>

      {data && (
        <section aria-label="DentiCare360 at a glance" className="mx-auto mt-12 max-w-4xl">
          <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[
              { label: "Verified doctors", value: data.doctors.length },
              { label: "Services offered", value: data.services },
              { label: "Areas of care", value: data.specialties.length },
              { label: "Languages spoken", value: data.languages },
            ].map((n) => (
              <div key={n.label} className="rounded-xl border border-border bg-white p-5 text-center shadow-sm">
                <dd className="text-3xl font-semibold text-navy">{n.value}</dd>
                <dt className="mt-1 text-sm text-navy/75">{n.label}</dt>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section aria-labelledby="principles-heading" className="mt-14">
        <h2 id="principles-heading" className="mb-6 text-center text-2xl font-semibold text-navy">
          What we stand for
        </h2>
        <ul className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map(({ icon: Icon, title, desc }, i) => (
            <li
              key={title}
              className="animate-fade-in-up rounded-xl border border-border bg-white p-6 shadow-sm"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-light text-navy">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-navy">{title}</h3>
              <p className="mt-1.5 text-sm text-navy/75">{desc}</p>
            </li>
          ))}
        </ul>
      </section>

      {data && data.specialties.length > 0 && (
        <section aria-labelledby="areas-heading" className="mx-auto mt-14 max-w-5xl">
          <h2 id="areas-heading" className="text-center text-2xl font-semibold text-navy">
            Areas of care
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {data.specialties.map((s) => (
              <li key={s.id} className="rounded-xl border border-border bg-white p-5">
                <h3 className="font-semibold text-navy">{s.name}</h3>
                <p className="mt-1 text-sm text-navy/80">{SPECIALTY_DETAILS[s.slug]?.tagline ?? s.description}</p>
                <Link
                  href={`/doctors?specialty=${s.slug}`}
                  className="mt-3 inline-block text-sm font-medium text-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  Meet our {s.name} doctors
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="-mx-5 mt-14">
        <HowItWorks tinted />
      </div>

      <div className="mt-14">
        <Faq id="about-faq" items={GENERAL_FAQS} />
      </div>

      <section className="mx-auto mt-14 max-w-2xl rounded-2xl bg-soft-blue p-8 text-center">
        <h2 className="text-xl font-semibold text-navy">Ready to see a doctor?</h2>
        <p className="mt-2 text-navy/75">Browse our specialists or book your first appointment in a few minutes.</p>
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button asChild>
            <Link href="/appointments/book">Book an appointment</Link>
          </Button>
          <Button variant="outline" asChild className="bg-white">
            <Link href="/doctors">Meet our doctors</Link>
          </Button>
        </div>
      </section>

      <p className="mx-auto mt-10 max-w-2xl text-center text-xs text-navy/70">
        DentiCare360 is a demo healthcare platform. All doctors, patients, reviews and records shown are fictional and
        used for illustrative purposes only.
      </p>
    </div>
  );
}
