import type { Metadata } from "next";
import Link from "next/link";
import { AI_DISCLAIMER } from "@/lib/ai-assistant";

export const metadata: Metadata = {
  title: "Privacy Policy — DentiCare360",
  description: "How DentiCare360 handles patient information, access controls, audit logging and the AI Health Assistant.",
};

const SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Demo platform",
    body: "DentiCare360 is a demonstration platform and every person, appointment and record in it is fictional. In a production deployment this policy would describe how real patient health information is handled under the health-privacy regulations that apply to the clinic.",
  },
  {
    title: "What we collect",
    body: "Account details (name, email, optional phone number), appointment history, the health profile you choose to provide (such as allergies, medications and emergency contact), documents you upload, payment records, and the messages you exchange with the AI Health Assistant.",
  },
  {
    title: "Protected records and access control",
    body: "Health records are only visible to the patient they belong to, to the doctors treating that patient, and to authorised administrators for support. Access is enforced on the server for every request, not only in the interface.",
  },
  {
    title: "Audit logging",
    body: "Sign-ins, failed sign-in attempts and access to or changes of protected records are written to an append-only audit log so that unusual activity can be reviewed.",
  },
  {
    title: "Payments and card data",
    body: "DentiCare360 does not store card numbers. In this demo no money moves and no card details are collected; a real deployment would use a payment provider's hosted checkout so card data never touches our servers.",
  },
  {
    title: "AI Health Assistant",
    body: (
      <>
        {AI_DISCLAIMER} It does not diagnose conditions, prescribe medication or handle emergencies. Anything it summarises
        for your doctor is labelled as patient-reported and is never a diagnosis. Conversations may be reviewed by
        administrators to keep the assistant safe and useful.
      </>
    ),
  },
  {
    title: "Retention",
    body: "Demo data in this environment is not intended to be kept long-term and may be reset at any time.",
  },
  {
    title: "Your choices and contact",
    body: (
      <>
        You can review and update your health profile from your patient dashboard. For any privacy question, please{" "}
        <Link href="/contact" className="font-medium text-navy underline underline-offset-2">
          contact us
        </Link>
        .
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-app max-w-3xl py-12">
      <h1 className="text-3xl font-semibold text-navy sm:text-4xl">Privacy Policy</h1>
      <p className="mt-3 text-navy/75">How we handle your information on DentiCare360.</p>
      <div className="mt-8 flex flex-col gap-8">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="text-lg font-semibold text-navy">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-navy/80">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
