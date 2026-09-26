import type { UrgencyLevel } from "@/types";

/**
 * Rule-based AI Health Assistant engine.
 *
 * Medical safety boundary: this engine never states a diagnosis, never names or
 * recommends a prescription medicine or dose, and never tells a patient to
 * change or stop a prescribed medication. Its job is limited to collecting
 * symptoms, asking clarifying questions, flagging red-flag/urgent
 * presentations, giving general educational information, and routing the
 * patient to the right specialist and appointment. Every reply comes from a
 * fixed set of templates, so there is no free-form generation that could drift
 * outside those boundaries. `isSafeAssistantText` lets any other reply source
 * (e.g. an LLM provider) be held to the same bar before it reaches a patient.
 */

export const AI_DISCLAIMER =
  "AI Health Assistant provides general health information and does not replace professional medical advice.";

export const EMERGENCY_NOTICE =
  "If this is an emergency, call your local emergency number or go to the nearest emergency department now.";

// ---------------------------------------------------------------- red flags

const RED_FLAG_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /chest (pain|pressure|tightness)|crushing pain|pressure in (my|the) chest/i, reason: "possible cardiac symptoms" },
  { pattern: /difficulty breathing|trouble breathing|can'?t breathe|cannot breathe|short(ness)? of breath|struggling to breathe|choking/i, reason: "breathing difficulty" },
  { pattern: /difficulty swallowing|trouble swallowing|can'?t swallow/i, reason: "swallowing difficulty" },
  { pattern: /severe bleeding|won'?t stop bleeding|bleeding (heavily|a lot|won'?t stop)|heavy bleeding|bleeding (is )?(not|won'?t) (stopping|stop)/i, reason: "uncontrolled bleeding" },
  { pattern: /(vomit|throwing up|cough(ing)?) (up )?blood|blood in (my )?(vomit|stool)/i, reason: "bleeding that needs urgent assessment" },
  { pattern: /suicid|kill myself|end my life|harm myself|want to die/i, reason: "risk of self-harm" },
  { pattern: /stroke|face droop|facial droop|slurred speech|sudden numbness|can'?t move (my )?(arm|leg|face)|sudden (severe )?confusion/i, reason: "possible stroke symptoms" },
  { pattern: /anaphyla|throat (is )?(closing|tight|swelling)|swelling of (my )?(face|throat|tongue|lips)|(face|tongue|lips|throat) (is |are )?swelling (fast|quickly|up)/i, reason: "possible severe allergic reaction" },
  { pattern: /unconscious|passed out|fainted|not responding|unresponsive|blacked out/i, reason: "loss of consciousness" },
  { pattern: /head injury|blow to the head|(hit|hurt|banged|bumped) (my|his|her|their) head|knocked (out cold|unconscious)|(?<!(?:tooth|teeth)s)(?:was|got|been|is) knocked out|lost consciousness/i, reason: "possible serious head injury" },
  { pattern: /(high )?fever.*(infant|newborn|baby)|(infant|newborn|baby).*(fever|won'?t wake|limp|blue|not feeding)/i, reason: "serious infant symptoms" },
  { pattern: /seizure|convulsion|fitting/i, reason: "possible seizure" },
  { pattern: /overdos|poison|swallowed (bleach|chemicals?|pills)/i, reason: "possible poisoning or overdose" },
  { pattern: /worst headache of my life|sudden severe headache/i, reason: "possible serious neurological symptoms" },
];

/** Serious but not necessarily 911: needs same-day professional evaluation. */
const URGENT_PATTERNS: { pattern: RegExp; reason: string }[] = [
  { pattern: /(swelling|swollen).*(jaw|cheek|face|gum)|(jaw|cheek|face|gum).*(swelling|swollen)/i, reason: "swelling around the mouth or face" },
  { pattern: /abscess|pus\b/i, reason: "a possible dental infection" },
  { pattern: /knocked[- ]out (a )?tooth|tooth (was |got )?knocked out|tooth (fell|came) out (after|from)|broken tooth|cracked tooth|chipped tooth (and|with) (bleeding|pain)/i, reason: "dental trauma" },
  { pattern: /(severe|unbearable|excruciating) (tooth|dental|jaw)/i, reason: "severe dental pain" },
  { pattern: /(tooth|dental|jaw).{0,30}(fever)|fever.{0,30}(tooth|dental|jaw)/i, reason: "dental pain with fever" },
];

// ---------------------------------------------------------------- medication

const MEDICATION_PATTERN =
  /\b(prescribe|prescription|dosage|dose|doses|antibiotics?|painkillers?|pain ?relief|medication|medicines?|meds|tablets?|pills?|which drug|what drug|can i take|should i take|is it safe to take|stop taking|skip my|ointment|cream for)\b/i;

// ---------------------------------------------------------------- routing rules

interface SpecialtyRule {
  specialtySlug: string;
  serviceSlug: string;
  label: string;
  patterns: RegExp[];
  /** Explicit "I need X"/"find a doctor" intents skip the clarifying question. */
  direct?: boolean;
}

const SPECIALTY_RULES: SpecialtyRule[] = [
  { specialtySlug: "dental", serviceSlug: "emergency-dental", label: "dental", patterns: [/tooth ?ache|tooth pain|teeth? (hurt|ache|pain)|toothache|cavity|cavities|wisdom tooth|jaw pain|sensitive teeth|tooth sensitivity/i, /gums?\b.{0,20}\b(bleed|bleeding|sore|swollen|painful)|bleeding gums?/i] },
  { specialtySlug: "dental", serviceSlug: "general-dentistry", label: "dental", direct: true, patterns: [/\bdentist\b|dental (check|clean|appointment|care)|teeth cleaning|braces|aligners?|whitening|root canal|dental/i] },
  { specialtySlug: "dermatology", serviceSlug: "acne", label: "dermatology", patterns: [/acne|pimples?|breakouts?|zits?/i] },
  { specialtySlug: "dermatology", serviceSlug: "skin-allergy", label: "dermatology", patterns: [/rash|itch(y|ing)?|hives|skin irrita|irritated skin|skin allerg|allerg.*skin|eczema|dry patches?/i] },
  { specialtySlug: "dermatology", serviceSlug: "pigmentation", label: "dermatology", patterns: [/dark spots?|pigmentation|uneven skin ?tone|melasma/i] },
  { specialtySlug: "dermatology", serviceSlug: "hair-loss", label: "dermatology", patterns: [/hair loss|hair thinning|hair (is )?falling|balding|dandruff|scalp/i] },
  { specialtySlug: "skin-face", serviceSlug: "anti-aging", label: "cosmetic skin", patterns: [/anti.?aging|wrinkles?|fine lines|skin aging|sagging/i] },
  { specialtySlug: "skin-face", serviceSlug: "skin-health", label: "skin", direct: true, patterns: [/skin (check|consult|health)|face consult/i] },
  { specialtySlug: "pediatric", serviceSlug: "childrens-health", label: "pediatric", patterns: [/my (son|daughter|child|baby|kid|toddler|infant)|\b(pediatric|paediatric|pediatrician)\b/i] },
  { specialtySlug: "general", serviceSlug: "general-physician", label: "general health", patterns: [/fever|\bcold\b|\bflu\b|cough|headache|stomach ?ache|nausea|fatigue|tired all the time|body ache|sore throat|dizz(y|iness)/i] },
  { specialtySlug: "general", serviceSlug: "general-physician", label: "general health", direct: true, patterns: [/find (me )?a doctor|see a doctor|need a doctor|book (an )?appointment|general physician|check.?up|\bgp\b/i] },
];

const EDUCATION: Record<string, string> = {
  dental:
    "In general, mouth and gum discomfort can have several different causes, and only an examination can tell them apart. Until you're seen, gentle brushing, rinsing with warm water, and avoiding very hot, cold or sweet foods often help people feel more comfortable.",
  dermatology:
    "In general, skin and hair concerns can have many causes. Until you're seen, gentle cleansing, avoiding picking or scratching, sun protection, and not starting new strong products without advice are commonly recommended.",
  "skin-face":
    "In general, skin health is supported by sun protection, gentle cleansing, moisturising, and a consistent routine. A specialist can suggest options suited to your skin.",
  pediatric:
    "In general, children's symptoms are best assessed by a clinician who can look at their age, history and how they're behaving. Keep them comfortable and hydrated, and note when the symptoms started.",
  general:
    "In general, rest, fluids and keeping track of your symptoms — when they started and whether they're changing — help a clinician understand what's going on.",
  preventive:
    "Regular checkups and screenings help catch issues early, often before you notice any symptoms.",
};

const CLARIFYING_QUESTIONS: Record<string, string> = {
  dental: "I'm sorry you're dealing with that. How long has it been going on, and does it get worse with hot, cold, or sweet food or when you bite down?",
  dermatology: "Thanks for telling me. How long have you noticed this, and has it been spreading, changing, or getting more uncomfortable?",
  "skin-face": "Is this a new concern, or something you've noticed gradually over time?",
  pediatric: "How old is your child, and how long have they had these symptoms?",
  general: "How long have you had these symptoms, and would you say they're mild, moderate, or severe?",
};

// ---------------------------------------------------------------- analysis

export interface AiAnalysis {
  urgency: UrgencyLevel;
  redFlagReason?: string;
  urgentReason?: string;
  isMedicationQuestion: boolean;
  specialtySlug?: string;
  serviceSlug?: string;
  specialtyLabel?: string;
  direct?: boolean;
}

export function analyzeMessage(message: string): AiAnalysis {
  for (const { pattern, reason } of RED_FLAG_PATTERNS) {
    if (pattern.test(message)) {
      return { urgency: "EMERGENCY", redFlagReason: reason, isMedicationQuestion: false };
    }
  }

  const isMedicationQuestion = MEDICATION_PATTERN.test(message);
  const rule = SPECIALTY_RULES.find((r) => r.patterns.some((p) => p.test(message)));
  const specialty = rule
    ? { specialtySlug: rule.specialtySlug, serviceSlug: rule.serviceSlug, specialtyLabel: rule.label, direct: rule.direct }
    : {};

  const urgent = URGENT_PATTERNS.find(({ pattern }) => pattern.test(message));
  if (urgent) {
    return {
      urgency: "HIGH",
      urgentReason: urgent.reason,
      isMedicationQuestion,
      // Urgent presentations of this kind are routed to same-day dental care.
      specialtySlug: "dental",
      serviceSlug: "emergency-dental",
      specialtyLabel: "dental",
    };
  }

  return { urgency: "LOW", isMedicationQuestion, ...specialty };
}

// ---------------------------------------------------------------- turns

export interface AiConversationContext {
  specialtySlug?: string;
  serviceSlug?: string;
  specialtyLabel?: string;
  stage: "new" | "clarifying" | "recommended";
}

export interface AiTurnResult {
  reply: string;
  urgency: UrgencyLevel;
  specialtySlug?: string;
  serviceSlug?: string;
  specialtyLabel?: string;
  showBookingCTA: boolean;
  quickReplies: string[];
  context: AiConversationContext;
}

export const START_CHIPS = [
  "I have tooth pain",
  "My gums are bleeding",
  "I have acne",
  "I have skin irritation",
  "I need a dentist",
  "Find a doctor",
];

/**
 * @param priorPatientMessages how many patient messages came before this one
 * @param latestMessage        the patient's newest message
 */
export function generateAiTurn(
  priorPatientMessages: number,
  latestMessage: string,
  context: AiConversationContext = { stage: "new" }
): AiTurnResult {
  const analysis = analyzeMessage(latestMessage);

  if (analysis.urgency === "EMERGENCY") {
    return {
      reply:
        `What you've described could be a medical emergency (${analysis.redFlagReason}). ` +
        `Please don't wait for an appointment or continue in chat — ${EMERGENCY_NOTICE.charAt(0).toLowerCase()}${EMERGENCY_NOTICE.slice(1)} ` +
        `If someone is with you, ask them to stay with you. I can't assess emergencies safely, and getting help in person is the priority.`,
      urgency: "EMERGENCY",
      showBookingCTA: false,
      quickReplies: [],
      context,
    };
  }

  if (analysis.urgency === "HIGH") {
    return {
      reply:
        `Because of ${analysis.urgentReason}, I'd recommend being seen by a dentist today if you can. ` +
        `I can show the earliest emergency dental appointment below. ` +
        `If the swelling spreads to your face or neck, or you have trouble breathing or swallowing, or a fever you can't manage, go to an emergency department immediately.`,
      urgency: "HIGH",
      specialtySlug: analysis.specialtySlug,
      serviceSlug: analysis.serviceSlug,
      specialtyLabel: analysis.specialtyLabel,
      showBookingCTA: true,
      quickReplies: ["Show me available doctors"],
      context: {
        specialtySlug: analysis.specialtySlug,
        serviceSlug: analysis.serviceSlug,
        specialtyLabel: analysis.specialtyLabel,
        stage: "recommended",
      },
    };
  }

  if (analysis.isMedicationQuestion) {
    const known = analysis.specialtySlug ?? context.specialtySlug;
    return {
      reply:
        "I can share general information, but I can't recommend or prescribe medicines or doses, and I can't advise you to change or stop a medicine a clinician has prescribed. " +
        "For anything about medication, please speak to a pharmacist or one of our doctors, who can look at your full history safely. " +
        (known ? "I can help you find the right appointment." : "Would you like help finding a doctor?"),
      urgency: "LOW",
      specialtySlug: known,
      serviceSlug: analysis.serviceSlug ?? context.serviceSlug,
      specialtyLabel: analysis.specialtyLabel ?? context.specialtyLabel,
      showBookingCTA: true,
      quickReplies: ["Find a doctor", "I have a different question"],
      context,
    };
  }

  // A newly identified specialty takes priority — except that the catch-all "general health"
  // must not hijack a thread that already has a more specific specialty ("it hurts with cold drinks").
  const hijacksThread = analysis.specialtySlug === "general" && !!context.specialtySlug && context.specialtySlug !== "general";
  if (analysis.specialtySlug && !hijacksThread) {
    const next: AiConversationContext = {
      specialtySlug: analysis.specialtySlug,
      serviceSlug: analysis.serviceSlug,
      specialtyLabel: analysis.specialtyLabel,
      stage: "clarifying",
    };
    if (priorPatientMessages === 0 && !analysis.direct) {
      return {
        reply: CLARIFYING_QUESTIONS[analysis.specialtySlug] ?? "Can you tell me a bit more about what you're experiencing?",
        urgency: "LOW",
        specialtySlug: analysis.specialtySlug,
        serviceSlug: analysis.serviceSlug,
        specialtyLabel: analysis.specialtyLabel,
        showBookingCTA: false,
        quickReplies: ["It's mild", "It's getting worse", "Not sure"],
        context: next,
      };
    }
    return recommend({ ...next, stage: "recommended" });
  }

  // No new specialty, but one was identified earlier — treat this reply
  // (e.g. "it's getting worse") as continuing that thread.
  if (context.specialtySlug) return recommend({ ...context, stage: "recommended" });

  if (priorPatientMessages === 0 && latestMessage.trim().length < 12) {
    return greeting(context);
  }

  return {
    reply:
      "Thanks for sharing that. Could you tell me a little more — where in the body it's happening, how long it's lasted, and how strong it feels? That helps me point you to the right specialist.",
    urgency: "LOW",
    showBookingCTA: false,
    quickReplies: ["It's dental", "It's skin-related", "It's a general health concern"],
    context,
  };
}

export function openingMessage(): AiTurnResult {
  return greeting({ stage: "new" });
}

function greeting(context: AiConversationContext): AiTurnResult {
  return {
    reply:
      "Hi, I'm the DentiCare360 AI Health Assistant. Tell me what you're experiencing — for example \"I have tooth pain\" or \"my skin is itchy\" — and I'll help you find the right next step. " +
      "I share general information only; I don't diagnose or prescribe.",
    urgency: "LOW",
    showBookingCTA: false,
    quickReplies: START_CHIPS,
    context,
  };
}

function recommend(context: AiConversationContext): AiTurnResult {
  const education = context.specialtySlug ? EDUCATION[context.specialtySlug] : undefined;
  return {
    reply:
      `Based on what you've described, a ${context.specialtyLabel ?? "specialist"} consultation would be appropriate. ` +
      `This is general guidance, not a diagnosis — a clinician will confirm what's going on. ` +
      (education ? `${education} ` : "") +
      `I can help you find the next available appointment.`,
    urgency: "LOW",
    specialtySlug: context.specialtySlug,
    serviceSlug: context.serviceSlug,
    specialtyLabel: context.specialtyLabel,
    showBookingCTA: true,
    quickReplies: ["I have another symptom"],
    context,
  };
}

/** Concise, clearly-labelled summary for the doctor. Patient-reported; never a diagnosis. */
export function buildDoctorSummary(messages: { sender: string; content: string }[], specialtyLabel?: string): string {
  const patientLines = messages
    .filter((m) => m.sender === "PATIENT")
    .map((m) => m.content.trim())
    .filter((c) => c.length > 0);
  if (patientLines.length === 0) return "No patient-reported symptoms captured.";
  const joined = patientLines.join(" • ").slice(0, 800);
  return `Patient-reported symptoms (not a confirmed diagnosis)${specialtyLabel ? ` — ${specialtyLabel} concern` : ""}: ${joined}`;
}

// ---------------------------------------------------------------- output guard

const UNSAFE_OUTPUT_PATTERNS: RegExp[] = [
  // A hedged assertion ("you probably have …") or a plain one naming a condition ("you have gingivitis").
  // Ordinary uses — "you have an appointment", "if you have trouble breathing" — are fine.
  /\byou (definitely|probably|likely|certainly|clearly) (have|are suffering from|suffer from)\b/i,
  /\byou (have|are suffering from|suffer from|got|are diagnosed with)\s+(an?\s+|the\s+)?(?:[a-z-]+\s+){0,3}(?:[a-z]+(?:itis|osis|emia|oma|pathy)|infection|disease|cancer|syndrome|disorder|abscess|cavit(?:y|ies)|acne|eczema|psoriasis|dermatitis|rosacea)\b/i,
  /\byou('| a)re (definitely |probably |likely )?(diagnosed|infected|suffering)\b/i,
  /\b(this is|it'?s|that'?s) (definitely|certainly|clearly|probably) (an? |the )?[a-z ]{3,30}(infection|disease|cancer|syndrome|disorder|condition)\b/i,
  /\bdiagnos(is|ed) (is|as|with)\b/i,
  /\b(take|use|try|apply|start|stop|increase|reduce|skip)\b[^.]{0,40}\b(ibuprofen|paracetamol|acetaminophen|aspirin|naproxen|amoxicillin|penicillin|azithromycin|clindamycin|metronidazole|prednisone|hydrocortisone|isotretinoin|accutane|tretinoin|minoxidil|finasteride|antibiotics?|steroids?|painkillers?)\b/i,
  /\b\d+(\.\d+)?\s?(mg|mcg|µg|ml|iu)\b/i,
  /\b(twice|three times|once) (a|per) day\b/i,
  /\b(stop|discontinue|change|reduce|skip|increase)\b[^.]{0,30}\b(your|the) (prescribed |current )?(medication|medicine|prescription|dose|pills|tablets)\b/i,
];

/** True when a piece of assistant text stays inside the safety boundary (no diagnosis, drug names, doses or medication changes). */
export function isSafeAssistantText(text: string): boolean {
  return !UNSAFE_OUTPUT_PATTERNS.some((p) => p.test(text));
}
