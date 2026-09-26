import { Star } from "lucide-react";

const TESTIMONIALS = [
  {
    name: "Priya S.",
    role: "Patient since 2024",
    quote:
      "I booked a dental cleaning and a skin consultation in the same afternoon, without visiting two different sites. It just worked.",
    rating: 5,
  },
  {
    name: "David M.",
    role: "Patient since 2023",
    quote:
      "The AI Assistant helped me work out that I needed a dermatologist, not a pharmacy run. It never tried to diagnose me. It just pointed me the right way.",
    rating: 5,
  },
  {
    name: "Fatima A.",
    role: "Patient since 2025",
    quote:
      "Rescheduling my son's pediatric appointment took less than a minute from my phone. A huge relief on a busy week.",
    rating: 4,
  },
];

export function Testimonials() {
  return (
    <section aria-labelledby="testimonials-heading" className="bg-soft-blue py-16">
      <div className="container-app">
        <div className="mx-auto mb-10 max-w-2xl text-center">
          <p className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-medium text-navy shadow-sm">
            Demo testimonials &mdash; fictional patients
          </p>
          <h2 id="testimonials-heading" className="mt-4 text-3xl font-semibold text-navy">
            What patients say
          </h2>
        </div>
        <ul className="grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <li key={t.name} className="flex">
              <figure className="flex w-full flex-col gap-4 rounded-xl border border-border bg-white p-6 shadow-sm">
                <div role="img" aria-label={`${t.rating} out of 5 stars`} className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < t.rating ? "fill-amber-400 text-amber-500" : "text-border"}`}
                      aria-hidden="true"
                    />
                  ))}
                </div>
                <blockquote className="flex-1 text-sm leading-relaxed text-navy/85">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption>
                  <span className="block text-sm font-semibold text-navy">{t.name}</span>
                  <span className="block text-xs text-navy/70">{t.role}</span>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
