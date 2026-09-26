import { createHmac, randomBytes } from "node:crypto";
import { db } from "@/database/client";
import { buildDoctorSummary, openingMessage, type AiConversationContext, type AiTurnResult } from "@/lib/ai-assistant";
import { getAssistantProvider, respondSafely } from "@/lib/assistant-provider";
import { ForbiddenError, NotFoundError } from "@/lib/errors";
import type { SessionUser } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import type { AiChatMessage, AiConversationSummary, UrgencyLevel } from "@/types";
import { audit } from "@/services/audit";
import { listDoctors } from "@/services/catalog";
import { toMessage } from "@/services/mappers";
import { getNextAvailableForDoctors } from "@/services/scheduling";

export { getAssistantProvider };

// ---------------------------------------------------------------- guest keys

function hashGuestKey(key: string): string {
  return createHmac("sha256", process.env.AUTH_SECRET ?? "dev-only-secret").update(key).digest("hex");
}

// ---------------------------------------------------------------- chat

export interface RecommendationCard {
  specialty: { slug: string; name: string };
  service?: { id: string; slug: string; name: string; startingPrice: number };
  doctors: {
    id: string;
    name: string;
    specialtyName: string;
    photoUrl?: string;
    rating: number;
    consultationFee: number;
    nextAvailable: { date: string; startTime: string } | null;
  }[];
}

export interface ChatResponse {
  conversationId: string;
  /** Returned once, when a guest conversation is created. Needed to resume it. */
  guestKey?: string;
  reply: string;
  urgency: UrgencyLevel;
  showBookingCTA: boolean;
  quickReplies: string[];
  summary: string;
  recommendation?: RecommendationCard;
}

async function buildRecommendation(turn: AiTurnResult): Promise<RecommendationCard | undefined> {
  if (!turn.showBookingCTA || !turn.specialtySlug) return undefined;
  const [specialty, service, allDoctors] = await Promise.all([
    db.specialty.findUnique({ where: { slug: turn.specialtySlug } }),
    turn.serviceSlug ? db.service.findUnique({ where: { slug: turn.serviceSlug } }) : null,
    listDoctors(),
  ]);
  if (!specialty) return undefined;

  const doctors = allDoctors.filter((d) => d.specialtySlug === turn.specialtySlug).slice(0, 3);
  const next = await getNextAvailableForDoctors(doctors);
  return {
    specialty: { slug: specialty.slug, name: specialty.name },
    service: service ? { id: service.id, slug: service.slug, name: service.name, startingPrice: Number(service.startingPrice) } : undefined,
    doctors: doctors
      .map((d) => ({
        id: d.id,
        name: d.name,
        specialtyName: d.specialtyName,
        photoUrl: d.photoUrl,
        rating: d.rating,
        consultationFee: d.consultationFee,
        nextAvailable: next.get(d.id) ? { date: next.get(d.id)!.date, startTime: next.get(d.id)!.slot.startTime } : null,
      }))
      // Soonest availability first; doctors with nothing open go last.
      .sort((a, b) => {
        const ka = a.nextAvailable ? `${a.nextAvailable.date} ${a.nextAvailable.startTime}` : "9999";
        const kb = b.nextAvailable ? `${b.nextAvailable.date} ${b.nextAvailable.startTime}` : "9999";
        return ka.localeCompare(kb);
      }),
  };
}

async function loadOwnedConversation(user: SessionUser | null, conversationId: string, guestKey?: string) {
  const conv = await db.aiConversation.findUnique({ where: { id: conversationId }, include: { messages: { orderBy: { createdAt: "asc" } } } });
  const isOwner = conv
    ? conv.patientId
      ? !!user && user.role === "PATIENT" && user.patientId === conv.patientId
      : !!guestKey && !!conv.guestKeyHash && hashGuestKey(guestKey) === conv.guestKeyHash
    : false;
  // Identical response for "missing" and "not yours" so ids cannot be probed.
  if (!conv || !isOwner) throw new NotFoundError("Conversation not found.");
  return conv;
}

export async function handleChatTurn(input: {
  user: SessionUser | null;
  ip: string;
  message: string;
  conversationId?: string;
  guestKey?: string;
}): Promise<ChatResponse> {
  const key = input.user?.id ?? input.ip;
  enforceRateLimit({ scope: "ai-chat", key, limit: 20, windowMs: 60_000 });
  enforceRateLimit({ scope: "ai-chat-day", key, limit: 300, windowMs: 24 * 60 * 60_000 });

  let conversation;
  let newGuestKey: string | undefined;
  if (input.conversationId) {
    conversation = await loadOwnedConversation(input.user, input.conversationId, input.guestKey);
  } else {
    const isPatient = input.user?.role === "PATIENT" && !!input.user.patientId;
    if (!isPatient) newGuestKey = randomBytes(24).toString("base64url");
    const created = await db.aiConversation.create({
      data: {
        patientId: isPatient ? input.user!.patientId : null,
        guestKeyHash: newGuestKey ? hashGuestKey(newGuestKey) : null,
      },
    });
    conversation = { ...created, messages: [] as Awaited<ReturnType<typeof loadOwnedConversation>>["messages"] };
  }

  const history = conversation.messages.map((m) => ({ sender: m.sender, content: m.content }));
  const priorPatientMessages = history.filter((m) => m.sender === "PATIENT").length;
  const context: AiConversationContext = {
    specialtySlug: conversation.specialtySlug ?? undefined,
    serviceSlug: conversation.serviceSlug ?? undefined,
    specialtyLabel: conversation.specialtyLabel ?? undefined,
    stage: (conversation.stage as AiConversationContext["stage"]) ?? "new",
  };

  const turn = await respondSafely(getAssistantProvider(), { priorPatientMessages, message: input.message, context, history });
  const allPatientMessages = [...history, { sender: "PATIENT" as const, content: input.message }];
  const summary = buildDoctorSummary(allPatientMessages, turn.context.specialtyLabel ?? turn.specialtyLabel);

  const rank: Record<UrgencyLevel, number> = { LOW: 0, MODERATE: 1, HIGH: 2, EMERGENCY: 3 };
  const urgency = rank[turn.urgency] >= rank[conversation.urgency] ? turn.urgency : conversation.urgency;

  await db.$transaction([
    db.aiMessage.create({ data: { conversationId: conversation.id, sender: "PATIENT", content: input.message } }),
    db.aiMessage.create({ data: { conversationId: conversation.id, sender: "AI", content: turn.reply, createdAt: new Date(Date.now() + 1) } }),
    db.aiConversation.update({
      where: { id: conversation.id },
      data: {
        urgency,
        stage: turn.context.stage,
        specialtySlug: turn.context.specialtySlug ?? null,
        serviceSlug: turn.context.serviceSlug ?? null,
        specialtyLabel: turn.context.specialtyLabel ?? null,
        summary,
      },
    }),
  ]);

  if (turn.urgency === "EMERGENCY") {
    await audit({
      userId: input.user?.id,
      action: "AI_EMERGENCY_FLAGGED",
      entityType: "AiConversation",
      entityId: conversation.id,
      ipAddress: input.ip,
    });
  }

  return {
    conversationId: conversation.id,
    guestKey: newGuestKey,
    reply: turn.reply,
    urgency: turn.urgency,
    showBookingCTA: turn.showBookingCTA,
    quickReplies: turn.quickReplies,
    summary,
    recommendation: await buildRecommendation(turn),
  };
}

export function getOpeningMessage(): AiChatMessage {
  const opening = openingMessage();
  return { id: "opening", sender: "AI", content: opening.reply, createdAt: new Date(0).toISOString() };
}

// ---------------------------------------------------------------- reads

export async function getConversationMessages(user: SessionUser | null, conversationId: string, guestKey?: string) {
  const conv = await loadOwnedConversation(user, conversationId, guestKey);
  return { id: conv.id, urgency: conv.urgency, summary: conv.summary ?? undefined, messages: conv.messages.map(toMessage) };
}

type ConversationRow = {
  id: string;
  patientId: string | null;
  urgency: UrgencyLevel;
  specialtyLabel: string | null;
  summary: string | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { messages: number };
  patient?: { user: { name: string } } | null;
};

function toConversationSummary(c: ConversationRow): AiConversationSummary {
  return {
    id: c.id,
    patientId: c.patientId ?? undefined,
    patientName: c.patient?.user.name,
    urgency: c.urgency,
    specialtyLabel: c.specialtyLabel ?? undefined,
    summary: c.summary ?? undefined,
    messageCount: c._count.messages,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}

export async function listConversationsForPatient(patientId: string): Promise<AiConversationSummary[]> {
  const rows = await db.aiConversation.findMany({
    where: { patientId },
    include: { _count: { select: { messages: true } } },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
  return rows.map(toConversationSummary);
}

/** Admin oversight of AI conversations (contains patient-reported health information — access is audit-logged). */
export async function listAllConversations(user: SessionUser, limit = 100): Promise<AiConversationSummary[]> {
  if (user.role !== "ADMIN") throw new ForbiddenError();
  const rows = await db.aiConversation.findMany({
    include: { _count: { select: { messages: true } }, patient: { include: { user: { select: { name: true } } } } },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
  return rows.map(toConversationSummary);
}

export async function getConversationForAdmin(user: SessionUser, id: string, ip?: string): Promise<AiConversationSummary> {
  if (user.role !== "ADMIN") throw new ForbiddenError();
  const row = await db.aiConversation.findUnique({
    where: { id },
    include: {
      _count: { select: { messages: true } },
      messages: { orderBy: { createdAt: "asc" } },
      patient: { include: { user: { select: { name: true } } } },
    },
  });
  if (!row) throw new NotFoundError("Conversation not found.");
  await audit({ userId: user.id, action: "AI_CONVERSATION_VIEWED", entityType: "AiConversation", entityId: id, ipAddress: ip });
  return { ...toConversationSummary(row), messages: row.messages.map(toMessage) };
}
