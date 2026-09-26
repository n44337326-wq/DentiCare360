import type { Metadata } from "next";
import Link from "next/link";
import { AI_DISCLAIMER } from "@/lib/ai-assistant";

export const metadata: Metadata = {
  title: "Terms of Service — DentiCare360",
  description: "The terms that apply when you use DentiCare360, including our AI and emergency disclaimers.",
};

const SECTIONS: { title: string; body: React.ReactNode; emphasis?: boolean }[] = [
  {
    title: "Demo platform",
    body: "DentiCare360 is a demonstration healthcare platform built for illustrative purposes. It is not a licensed medical provider, all doctors, patients and reviews are fictional, and using it does not create a doctor-patient relationship.",
  },
  {
    title: "Emergency disclaimer",
    emphasis: true,
    body: "If you are experiencing a medical emergency, call your local emergency number or go to the nearest emergency department. DentiCare360 and its AI Health Assistant are not for emergencies, and you should never wait for an appointment or a chat reply when your health is at immediate risk.",
  },
  {
    title: "AI Health Assistant and medical disclaimer",
    emphasis: true,
    body: `${AI_DISCLAIMER} It does not diagnose conditions, prescribe medication or advise you to start, change or stop a medicine. Only a qualified clinician who has examined you can give medical advice.`,
  },
  {
    title: "Appointments",
    body: "Appointment times are shown from the doctors' live availability. A doctor may become unavailable, in which case you will be notified and asked to reschedule. Please cancel or reschedule if you can no longer attend.",
  },
  {
    title: "Your account",
    body: "Keep your sign-in details private and provide accurate information. You are responsible for activity on your account. We may suspend accounts that are used to misuse the service or to attempt to access other people's records.",
  },
  {
    title: "Payments",
    body: "In this demo, payments are simulated: no money is charged and no card details are collected. Prices shown are illustrative starting prices.",
  },
  {
    title: "Privacy",
    body: (
      <>
        How we handle your information is described in our{" "}
        <Link href="/privacy" className="font-medium text-navy underline underline-offset-2">
          Privacy Policy
        </Link>
        .
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <div className="container-app max-w-3xl py-12">
      <h1 className="text-3xl font-semibold text-navy sm:text-4xl">Terms of Service</h1>
      <p className="mt-3 text-navy/75">Please read these terms before using DentiCare360.</p>
      <div className="mt-8 flex flex-col gap-6">
        {SECTIONS.map((s) => (
          <section
            key={s.title}
            className={s.emphasis ? "rounded-xl border border-amber-200 bg-amber-50 p-5" : undefined}
          >
            <h2 className="text-lg font-semibold text-navy">{s.title}</h2>
            <p className="mt-2 leading-relaxed text-navy/80">{s.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
