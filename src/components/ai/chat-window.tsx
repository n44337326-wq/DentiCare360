"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { CalendarPlus, RotateCcw, Sparkles } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { LoadingState } from "@/components/shared/states";
import { AI_DISCLAIMER, openingMessage } from "@/lib/ai-assistant";
import { cn } from "@/lib/utils";
import { ChatInput } from "@/components/ai/chat-input";
import { DoctorSummaryPanel } from "@/components/ai/doctor-summary-panel";
import { EmergencyNotice, UrgentNotice } from "@/components/ai/emergency-notice";
import { ErrorBubble, MessageBubble } from "@/components/ai/message-bubble";
import { RecommendationCard } from "@/components/ai/recommendation-card";
import { SuggestionChips } from "@/components/ai/suggestion-chips";
import { TypingIndicator } from "@/components/ai/typing-indicator";
import { useAiChat } from "@/components/ai/use-ai-chat";

const GREETING = openingMessage().reply;

/** The AI Health Assistant conversation: header, safety notices, message log, suggestions, composer and disclaimer. */
export function ChatWindow({ className }: { className?: string }) {
  const chat = useAiChat();
  const { data: session } = useSession();
  const isPatient = session?.user?.role === "PATIENT";
  const emergency = chat.urgency === "EMERGENCY";
  const sending = chat.status === "sending";
  const restoring = chat.status === "restoring";
  const hasConversation = chat.messages.length > 0;

  const logRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = logRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
  }, [chat.messages.length, chat.status, chat.error, chat.recommendation]);

  const showCta = chat.showBookingCTA && !emergency && !chat.recommendation && !sending;
  const ctaParams = new URLSearchParams(chat.conversationId ? { conversation: chat.conversationId } : {}).toString();

  return (
    <section
      aria-label="AI Health Assistant chat"
      className={cn(
        "flex h-[calc(100dvh-9rem)] min-h-[32rem] flex-col overflow-hidden rounded-xl border border-border bg-soft-blue/40 shadow-sm lg:h-[46rem]",
        className
      )}
    >
      <header className="flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-navy text-white">
          <Sparkles className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-navy">AI Health Assistant</h2>
          <p className="truncate text-xs text-slate-600">An assistant that helps you find the right care — not a doctor.</p>
        </div>
        {hasConversation && (
          <Button type="button" variant="ghost" size="sm" className="h-10" onClick={chat.reset} disabled={sending}>
            <RotateCcw /> Start over
          </Button>
        )}
      </header>

      {(emergency || chat.urgency === "HIGH") && <div className="border-b border-border bg-white p-3">{emergency ? <EmergencyNotice /> : <UrgentNotice />}</div>}

      <div ref={logRef} role="log" aria-live="polite" aria-label="Conversation" className="flex-1 space-y-3 overflow-y-auto px-3 py-4 sm:px-4">
        <MessageBubble sender="AI" content={GREETING} />
        {restoring && <LoadingState label="Restoring your conversation…" className="py-3" />}
        {chat.messages.map((m) => (
          <MessageBubble key={m.id} sender={m.sender} content={m.content} />
        ))}
        {sending && <TypingIndicator />}
        {chat.error && <ErrorBubble error={chat.error} onRetry={chat.retry} onStartOver={chat.reset} />}

        {!sending && !restoring && !emergency && !chat.error && (
          <div className="pl-10">
            <SuggestionChips chips={chat.quickReplies} onPick={(text) => void chat.send(text)} />
          </div>
        )}
        {!sending && !emergency && chat.recommendation && (
          <RecommendationCard recommendation={chat.recommendation} conversationId={chat.conversationId} />
        )}
        {showCta && (
          <div className="pl-10">
            <Link href={`/appointments/book${ctaParams ? `?${ctaParams}` : ""}`} className={cn(buttonVariants(), "h-11")}>
              <CalendarPlus /> Book an appointment
            </Link>
          </div>
        )}
        {hasConversation && !restoring && <DoctorSummaryPanel summary={chat.summary} isPatient={isPatient} />}
      </div>

      <div className="space-y-2 border-t border-border bg-white px-3 pb-3 pt-3 sm:px-4">
        <p className="text-xs leading-snug text-slate-700">{AI_DISCLAIMER}</p>
        <ChatInput onSend={(text) => void chat.send(text)} sending={sending || restoring} emergency={emergency} />
      </div>
    </section>
  );
}
