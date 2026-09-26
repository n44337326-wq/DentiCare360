/**
 * Editorial content shown across the public site. Kept in one place so pages stay
 * consistent. Everything here is general information about how the (fictional)
 * clinic works — never medical advice.
 */
import type { ServiceCategory } from "@/types";

export interface SpecialtyDetail {
  /** One-line summary shown on cards. */
  tagline: string;
  /** Typical reasons people book this kind of care. */
  treats: string[];
  /** What a first visit usually involves. */
  firstVisit: string;
}

export const SPECIALTY_DETAILS: Record<string, SpecialtyDetail> = {
  dental: {
    tagline: "Checkups, cleanings, fillings, braces, implants and urgent tooth pain.",
    treats: ["Tooth pain", "Bleeding gums", "Cleaning & checkups", "Braces & aligners", "Whitening", "Root canal"],
    firstVisit: "A dentist looks at your teeth and gums, asks about your history and explains your options before any treatment.",
  },
  dermatology: {
    tagline: "Medical care for acne, rashes, pigmentation, hair and scalp concerns.",
    treats: ["Acne & breakouts", "Rashes & allergies", "Dark spots", "Hair loss", "Scalp care", "Eczema"],
    firstVisit: "Your dermatologist examines the skin, asks how long it has been happening and agrees a plan with you.",
  },
  "skin-face": {
    tagline: "Cosmetic skin consultations, anti-ageing advice and everyday skin health.",
    treats: ["Fine lines & wrinkles", "Skin health review", "Sun protection", "Skincare routine", "Skin tone concerns"],
    firstVisit: "A relaxed conversation about your goals, a skin assessment and a realistic, step-by-step plan.",
  },
  general: {
    tagline: "Everyday health concerns, women's health, nutrition and check-ups.",
    treats: ["Fever, cough & cold", "Headaches", "Fatigue", "Women's health", "Nutrition advice", "Health check-ups"],
    firstVisit: "Your physician reviews your symptoms and history, may suggest tests, and tells you if a specialist would help.",
  },
  pediatric: {
    tagline: "Gentle, age-appropriate care for babies, children and teenagers.",
    treats: ["Fever & infections", "Growth & development", "Routine check-ups", "Vaccination questions", "Feeding & sleep"],
    firstVisit: "A friendly check-up built around your child's age — parents are welcome to ask anything.",
  },
  preventive: {
    tagline: "Screenings and check-ups that catch problems before they start.",
    treats: ["Annual check-ups", "Health screenings", "Lifestyle advice", "Risk reviews"],
    firstVisit: "A full review of your history and habits, with a simple prevention plan you can act on.",
  },
};

export interface CategoryDetail {
  included: string[];
  whoFor: string;
  expect: string[];
}

export const CATEGORY_DETAILS: Record<ServiceCategory, CategoryDetail> = {
  Dental: {
    whoFor: "Anyone with tooth or gum concerns, and anyone due for a routine check-up — including children.",
    included: ["Oral examination", "Personalised treatment options", "Clear pricing before treatment", "Aftercare guidance"],
    expect: ["Arrive 10 minutes early for your first visit", "Bring a list of any medicines you take", "Tell us about allergies, especially to anaesthetics or latex"],
  },
  "Skin & Dermatology": {
    whoFor: "People with acne, rashes, pigmentation, hair or scalp concerns, and anyone who wants expert skin advice.",
    included: ["Skin and scalp assessment", "Personalised care plan", "Guidance on daily skincare", "Follow-up recommendations"],
    expect: ["Come without heavy makeup if the concern is on your face", "Note when it started and what makes it better or worse", "Bring the names of products you currently use"],
  },
  "General Health": {
    whoFor: "Adults and children with everyday health concerns, women's health questions, nutrition goals or preventive care needs.",
    included: ["Symptom and history review", "Advice and next steps", "Referral to a specialist if needed", "Prevention guidance"],
    expect: ["Write down your symptoms and how long you've had them", "Bring recent reports or test results", "Online visits are available with many doctors"],
  },
};

export const HOW_IT_WORKS = [
  { title: "Tell us what you need", desc: "Pick a service, or describe it to the AI Health Assistant and it will point you to the right kind of specialist." },
  { title: "Choose a doctor and time", desc: "See each doctor's real availability. If they're away on your date, we show the next open appointments straight away." },
  { title: "Confirm in a minute", desc: "Add a few details, choose in-person or online, and confirm. You'll get a notification and a reminder before your visit." },
  { title: "See your doctor", desc: "Visit the clinic or join online. Afterwards, find your notes, documents and invoices in your secure patient portal." },
];

export interface FaqItem {
  q: string;
  a: string;
}

export const GENERAL_FAQS: FaqItem[] = [
  { q: "How do I book an appointment?", a: "Choose 'Book an appointment', pick a service, specialist, date and time, then add your details. It takes about a minute, and you'll see confirmation straight away." },
  { q: "Can I change or cancel my appointment?", a: "Yes. From your patient portal you can reschedule to another open time or cancel any upcoming appointment. A cancelled slot is released for other patients, and a paid fee is refunded." },
  { q: "What if my doctor is unavailable on the day I want?", a: "You'll see a clear message such as “Dr. Kim is unavailable on Tuesday”, followed by the next available dates and times, which you can pick in one click." },
  { q: "Do you offer online consultations?", a: "Many of our doctors do. When you book, choose 'Online' if the doctor supports it. Your join link appears in your patient portal, and opens shortly before the visit." },
  { q: "Is my health information private?", a: "Yes. Records are visible only to you and the clinicians treating you. Every time a protected record is opened, it is written to an audit log." },
  { q: "How much does a visit cost?", a: "Each doctor shows their consultation fee, and each service shows a starting price. In this demo, payments are simulated and no card details are collected." },
];

export const AI_FAQS: FaqItem[] = [
  { q: "Can the AI Health Assistant diagnose me?", a: "No. It gives general health information, asks clarifying questions and helps you find the right specialist and appointment. Only a licensed clinician can diagnose." },
  { q: "Will it recommend medicines?", a: "No. For anything about medicines or doses it directs you to a pharmacist or one of our doctors, and it never advises changing a prescribed medicine." },
  { q: "What if my symptoms are serious?", a: "If you describe warning signs such as chest pain or trouble breathing, it stops and tells you to seek emergency care immediately instead of continuing in chat." },
];

export const SERVICES_FAQS: FaqItem[] = [
  { q: "Why is a price shown as 'From'?", a: "It's the starting price of the service. The final cost depends on your consultation and any treatment your doctor recommends, which is always explained before you agree." },
  { q: "How long will my appointment last?", a: "Each service lists a typical duration. Booking reserves a 30-minute consultation slot; longer treatments are planned with you during that consultation." },
  { q: "Who will I see for my service?", a: "Each service lists the suitable specialist. You choose from the available doctors of that specialty when you book." },
  { q: "Can I book more than one service?", a: "Yes. You can book them one after another — for example a dental cleaning and a skin consultation, all from the same account." },
];

export const DOCTORS_FAQS: FaqItem[] = [
  { q: "How do I know a doctor is available?", a: "Each card shows an Available or Unavailable badge and the doctor's next open slot, checked live against their real schedule." },
  { q: "What does 'Unavailable' mean?", a: "The doctor is temporarily away or not taking bookings right now. You can still view their profile, or choose another doctor of the same specialty." },
  { q: "Can I choose in-person or online?", a: "Use the consultation-type filter to see doctors who offer online visits, in-person visits, or both." },
  { q: "I don't know which specialist I need.", a: "Ask the AI Health Assistant. It will ask a few questions and suggest the right type of specialist and the earliest available appointment." },
];

export const CONTACT_FAQS: FaqItem[] = [
  { q: "How quickly will you reply?", a: "We aim to answer messages within one working day. For anything urgent, please don't use the form — call the clinic or seek emergency care." },
  { q: "Can I get medical advice by message?", a: "No. Messages are for questions about the platform, your account and our services. For medical concerns, book an appointment with a doctor." },
  { q: "How do I change my account details?", a: "Sign in to your patient portal to update your health profile and emergency contact. For other changes, send us a message and we'll help." },
];
