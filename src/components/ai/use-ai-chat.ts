"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ApiError, apiFetch, errorMessage } from "@/lib/api-client";
import { START_CHIPS } from "@/lib/ai-assistant";
import type { ChatResponse, RecommendationCard } from "@/services/ai";
import type { AiChatMessage, UrgencyLevel } from "@/types";

const STORAGE_KEY = "denticare360.ai-chat";
const MIN_TYPING_MS = 500;
const RANK: Record<UrgencyLevel, number> = { LOW: 0, MODERATE: 1, HIGH: 2, EMERGENCY: 3 };

export interface ChatMessage {
  id: string;
  sender: "PATIENT" | "AI";
  content: string;
}

export interface ChatError {
  kind: "rate-limit" | "expired" | "failed";
  message: string;
  /** The message to resend on Retry. */
  retryText?: string;
}

export type ChatStatus = "restoring" | "idle" | "sending";

interface Saved {
  conversationId: string;
  guestKey?: string;
}

const readSaved = (): Saved | null => {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Partial<Saved>) : null;
    return parsed && typeof parsed.conversationId === "string" ? { conversationId: parsed.conversationId, guestKey: parsed.guestKey } : null;
  } catch {
    return null;
  }
};
const writeSaved = (saved: Saved | null) => {
  try {
    if (saved) window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
    else window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable: the chat still works, it just can't be resumed */
  }
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** State and behaviour of the AI Health Assistant conversation. */
export function useAiChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [urgency, setUrgency] = useState<UrgencyLevel>("LOW");
  const [quickReplies, setQuickReplies] = useState<string[]>(START_CHIPS);
  const [showBookingCTA, setShowBookingCTA] = useState(false);
  const [summary, setSummary] = useState("");
  const [recommendation, setRecommendation] = useState<RecommendationCard | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [restoreDone, setRestoreDone] = useState(false);
  // Whether this tab has a saved conversation; false on the server so hydration matches.
  const hasSaved = useSyncExternalStore(
    () => () => {},
    () => readSaved() !== null,
    () => false
  );
  const status: ChatStatus = sending ? "sending" : hasSaved && !restoreDone ? "restoring" : "idle";
  const [error, setError] = useState<ChatError | null>(null);

  const conversation = useRef<Saved | null>(null);
  const inFlight = useRef(false);
  const counter = useRef(0);

  // Resume a conversation from this browser tab, if there is one.
  useEffect(() => {
    const saved = readSaved();
    if (!saved) return;
    let cancelled = false;
    const qs = saved.guestKey ? `?guestKey=${encodeURIComponent(saved.guestKey)}` : "";
    apiFetch<{ id: string; urgency: UrgencyLevel; summary?: string; messages: AiChatMessage[] }>(
      `/api/ai/conversations/${encodeURIComponent(saved.conversationId)}${qs}`
    )
      .then((data) => {
        if (cancelled) return;
        conversation.current = saved;
        setConversationId(data.id);
        setMessages(data.messages.map((m) => ({ id: m.id, sender: m.sender, content: m.content })));
        setUrgency(data.urgency);
        setSummary(data.summary ?? "");
        setQuickReplies([]);
      })
      .catch(() => {
        // Expired, not ours, or the network is down: start fresh.
        if (!cancelled) writeSaved(null);
      })
      .finally(() => {
        if (!cancelled) setRestoreDone(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const send = useCallback(async (raw: string, options: { retry?: boolean } = {}) => {
    const text = raw.trim();
    if (!text || inFlight.current) return;
    inFlight.current = true;
    setRestoreDone(true);
    if (!options.retry) {
      counter.current += 1;
      setMessages((prev) => [...prev, { id: `local-${counter.current}`, sender: "PATIENT", content: text }]);
    }
    setError(null);
    setSending(true);
    const started = Date.now();
    try {
      const res = await apiFetch<ChatResponse>("/api/ai/chat", {
        method: "POST",
        json: {
          message: text,
          ...(conversation.current ? { conversationId: conversation.current.conversationId } : {}),
          ...(conversation.current?.guestKey ? { guestKey: conversation.current.guestKey } : {}),
        },
      });
      const wait = MIN_TYPING_MS - (Date.now() - started);
      if (wait > 0) await sleep(wait);

      conversation.current = { conversationId: res.conversationId, guestKey: res.guestKey ?? conversation.current?.guestKey };
      writeSaved(conversation.current);
      counter.current += 1;
      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { id: `ai-${counter.current}`, sender: "AI", content: res.reply }]);
      setUrgency((prev) => (RANK[res.urgency] >= RANK[prev] ? res.urgency : prev));
      setQuickReplies(res.quickReplies);
      setShowBookingCTA(res.showBookingCTA);
      setSummary(res.summary);
      setRecommendation(res.recommendation ?? null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429) {
        setError({
          kind: "rate-limit",
          message: "You're sending messages quickly. Please wait a moment (about a minute) and then try again.",
          retryText: text,
        });
      } else if (err instanceof ApiError && err.status === 404 && conversation.current) {
        writeSaved(null);
        setError({ kind: "expired", message: "We couldn't find this conversation any more. Please start over to continue." });
      } else {
        setError({ kind: "failed", message: errorMessage(err), retryText: text });
      }
    } finally {
      inFlight.current = false;
      setSending(false);
    }
  }, []);

  const retry = useCallback(() => {
    if (error?.retryText) void send(error.retryText, { retry: true });
  }, [error, send]);

  const reset = useCallback(() => {
    setRestoreDone(true);
    writeSaved(null);
    conversation.current = null;
    setMessages([]);
    setUrgency("LOW");
    setQuickReplies(START_CHIPS);
    setShowBookingCTA(false);
    setSummary("");
    setRecommendation(null);
    setConversationId(null);
    setError(null);
  }, []);

  return {
    messages,
    urgency,
    quickReplies,
    showBookingCTA,
    summary,
    recommendation,
    conversationId,
    status,
    error,
    send,
    retry,
    reset,
  };
}
