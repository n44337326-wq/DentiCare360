import Link from "next/link";
import { AlertTriangle } from "lucide-react";

const GROUPS: { title: string; links: { href: string; label: string }[] }[] = [
  {
    title: "Services",
    links: [
      { href: "/services#dental", label: "Dental care" },
      { href: "/services#dermatology", label: "Skin & dermatology" },
      { href: "/services#general", label: "General health" },
      { href: "/ai-assistant", label: "AI Health Assistant" },
    ],
  },
  {
    title: "Doctors",
    links: [
      { href: "/doctors", label: "Find a doctor" },
      { href: "/doctors?available=now", label: "Available this week" },
      { href: "/doctors?consultation=online", label: "Online consultations" },
      { href: "/appointments/book", label: "Book an appointment" },
    ],
  },
  {
    title: "Patient portal",
    links: [
      { href: "/patient/dashboard", label: "Dashboard" },
      { href: "/patient/appointments", label: "My appointments" },
      { href: "/patient/health-profile", label: "Health profile" },
      { href: "/login", label: "Sign in" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy text-white/80">
      <div className="container-app grid gap-10 py-12 lg:grid-cols-[1.2fr_2fr]">
        <div>
          <p className="text-lg font-semibold text-white">
            DentiCare<span className="text-cyan">360</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-white/70">
            Complete care. One trusted clinic. Dental, skin and everyday health from a single secure platform.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {GROUPS.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold text-white">{group.title}</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded text-white/75 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="container-app pb-8">
        <p
          role="note"
          className="flex items-start gap-3 rounded-lg bg-white/10 p-4 text-sm text-white/85"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
          <span>
            <strong className="font-semibold text-white">Emergency disclaimer.</strong> If you are experiencing a medical
            emergency, call your local emergency number or go to the nearest emergency department. DentiCare360 and its
            AI Health Assistant are not for emergencies.
          </span>
        </p>
      </div>

      <div className="container-app border-t border-white/10 py-5 text-center text-xs text-white/65">
        &copy; {new Date().getFullYear()} DentiCare360. This is a demo platform: all doctors, patients, reviews and
        records shown are fictional demo data.
      </div>
    </footer>
  );
}
