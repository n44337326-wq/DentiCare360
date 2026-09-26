import type { Metadata } from "next";
import Link from "next/link";
import { Bot, CalendarPlus, Clock, Mail, MapPin, Phone, Siren } from "lucide-react";
import { Card } from "@/components/ui/card";
import { InlineAlert } from "@/components/shared/states";
import { ContactForm } from "@/app/contact/contact-form";
import { Faq } from "@/components/content/faq";
import { CONTACT_FAQS } from "@/content/site-content";

export const metadata: Metadata = {
  title: "Contact — DentiCare360",
  description: "Get in touch with the DentiCare360 team.",
};

const DETAILS = [
  { icon: MapPin, label: "Address", lines: ["DentiCare360 Downtown Clinic", "120 Example Avenue, Suite 4", "Springfield, NY 10001"] },
  { icon: Phone, label: "Phone", lines: ["(555) 010-0360"] },
  { icon: Mail, label: "Email", lines: ["hello@denticare360.example"] },
  { icon: Clock, label: "Hours", lines: ["Mon–Fri 8:00 AM – 6:00 PM", "Sat 9:00 AM – 1:00 PM", "Closed Sunday"] },
];

const QUICK_HELP = [
  { icon: CalendarPlus, title: "Book an appointment", desc: "The fastest way to see a doctor. Pick a service, doctor and time online.", href: "/appointments/book", cta: "Start booking" },
  { icon: Bot, title: "Ask the AI assistant", desc: "Describe what you're feeling and get pointed to the right specialist. It never diagnoses.", href: "/ai-assistant", cta: "Open assistant" },
  { icon: Siren, title: "Emergency?", desc: "Call your local emergency number or go to the nearest emergency department. Do not wait for a reply.", href: undefined, cta: undefined },
];

const DEPARTMENTS = [
  { name: "Appointments & scheduling", email: "appointments@denticare360.example", note: "Booking, rescheduling and availability questions" },
  { name: "Billing & invoices", email: "billing@denticare360.example", note: "Payments, refunds and invoice copies" },
  { name: "Privacy & records", email: "privacy@denticare360.example", note: "Access to your data and document questions" },
];

export default function ContactPage() {
  return (
    <div className="container-app py-12">
      <header className="mb-8 max-w-2xl">
        <h1 className="text-3xl font-semibold text-navy sm:text-4xl">Contact us</h1>
        <p className="mt-3 text-navy/75">Questions about the platform, your account or our services? Send us a message.</p>
      </header>

      <InlineAlert variant="warning" className="mb-8 max-w-3xl">
        <p>
          <strong>This form is not for emergencies.</strong> If you are experiencing a medical emergency, call your
          local emergency number or go to the nearest emergency department.
        </p>
      </InlineAlert>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <Card className="p-6 sm:p-8">
          <h2 className="mb-5 text-xl font-semibold text-navy">Send a message</h2>
          <ContactForm />
        </Card>

        <aside aria-label="Clinic details" className="flex flex-col gap-5">
          <Card className="p-6">
            <h2 className="mb-4 text-lg font-semibold text-navy">Clinic details</h2>
            <dl className="flex flex-col gap-4 text-sm">
              {DETAILS.map(({ icon: Icon, label, lines }) => (
                <div key={label} className="flex gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-cyan-light text-navy">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div>
                    <dt className="font-medium text-navy">{label}</dt>
                    <dd className="text-navy/80">
                      {lines.map((l) => (
                        <span key={l} className="block">
                          {l}
                        </span>
                      ))}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </Card>
          <p className="text-xs text-navy/70">
            DentiCare360 is a demo platform. The address, phone number and email above are fictional.
          </p>
        </aside>
      </div>

      <section aria-labelledby="help-heading" className="mt-14">
        <h2 id="help-heading" className="text-2xl font-semibold text-navy">
          Other ways to get help
        </h2>
        <ul className="mt-5 grid gap-4 md:grid-cols-3">
          {QUICK_HELP.map(({ icon: Icon, title, desc, href, cta }) => (
            <li key={title} className="flex flex-col rounded-xl border border-border bg-white p-5 shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-light text-navy">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-semibold text-navy">{title}</h3>
              <p className="mt-1 flex-1 text-sm text-navy/80">{desc}</p>
              {href && cta && (
                <Link href={href} className="mt-3 text-sm font-medium text-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
                  {cta}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dept-heading" className="mt-14">
        <h2 id="dept-heading" className="text-2xl font-semibold text-navy">
          Who to contact
        </h2>
        <dl className="mt-5 grid gap-4 md:grid-cols-3">
          {DEPARTMENTS.map((d) => (
            <div key={d.name} className="rounded-xl border border-border bg-white p-5">
              <dt className="font-semibold text-navy">{d.name}</dt>
              <dd className="mt-1 text-sm text-navy/80">{d.note}</dd>
              <dd className="mt-2 text-sm font-medium text-navy">{d.email}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-xs text-navy/70">These addresses are fictional demo contacts.</p>
      </section>

      <div className="mt-14">
        <Faq id="contact-faq" items={CONTACT_FAQS} />
      </div>
    </div>
  );
}
