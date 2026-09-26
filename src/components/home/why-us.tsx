import { BadgeCheck, CalendarClock, HeartHandshake, Layers, LockKeyhole, Radar } from "lucide-react";

const ITEMS = [
  {
    icon: Layers,
    title: "One platform",
    desc: "Dental, skin and general health without juggling separate websites.",
    detail: "One account, one set of records and one place for appointments, documents and payments.",
  },
  {
    icon: BadgeCheck,
    title: "Verified doctors",
    desc: "Every specialist is credential-checked before joining DentiCare360.",
    detail: "Each profile lists qualifications, experience, languages and patient ratings so you can choose with confidence.",
  },
  {
    icon: CalendarClock,
    title: "Easy appointments",
    desc: "Book in minutes with a guided, step-by-step flow.",
    detail: "Reschedule or cancel yourself at any time, and get confirmations and reminders automatically.",
  },
  {
    icon: Radar,
    title: "Smart availability",
    desc: "Real-time scheduling means you only see times that are actually open.",
    detail: "If a doctor is away, we tell you plainly and suggest the next open appointments right away.",
  },
  {
    icon: LockKeyhole,
    title: "Secure patient records",
    desc: "Your health data is access-controlled by role and every access is logged.",
    detail: "Documents are stored privately, and only you and the clinicians treating you can open them.",
  },
  {
    icon: HeartHandshake,
    title: "Human-led healthcare",
    desc: "AI helps you get organised. Licensed clinicians make every medical decision.",
    detail: "Our assistant never diagnoses or prescribes, and sends emergencies straight to urgent care.",
  },
];

export function WhyUs() {
  return (
    <section aria-labelledby="why-heading" className="container-app py-16">
      <div className="mx-auto mb-10 max-w-2xl text-center">
        <h2 id="why-heading" className="text-3xl font-semibold text-navy">
          Why DentiCare360
        </h2>
        <p className="mt-2 text-navy/75">Care that is simple to reach and safe to trust.</p>
      </div>
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map(({ icon: Icon, title, desc, detail }, i) => (
          <li
            key={title}
            className="animate-fade-in-up flex flex-col gap-3 rounded-xl border border-border bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-cyan-light text-navy">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </span>
            <h3 className="font-semibold text-navy">{title}</h3>
            <p className="text-sm text-navy/80">{desc}</p>
            <p className="border-t border-border pt-3 text-sm text-navy/70">{detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
