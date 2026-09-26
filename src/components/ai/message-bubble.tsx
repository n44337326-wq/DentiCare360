import { AlertCircle, RotateCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatError } from "@/components/ai/use-ai-chat";

export function AssistantAvatar() {
  return (
    <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soft-blue text-cyan ring-1 ring-navy/10">
      <Sparkles className="h-4 w-4" />
    </span>
  );
}

/** One chat turn: the patient on the right, the assistant on the left. */
export function MessageBubble({ sender, content }: { sender: "PATIENT" | "AI"; content: string }) {
  const fromPatient = sender === "PATIENT";
  return (
    <div className={cn("flex items-end gap-2 animate-fade-in", fromPatient && "justify-end")}>
      {!fromPatient && <AssistantAvatar />}
      <div
        className={cn(
          "max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm sm:max-w-[75%]",
          fromPatient ? "rounded-br-md bg-navy text-white" : "rounded-bl-md border border-border bg-white text-navy"
        )}
      >
        <span className="sr-only">{fromPatient ? "You said: " : "Assistant said: "}</span>
        {content}
      </div>
    </div>
  );
}

/** Inline error shown in the conversation. Retry resends the failed message without duplicating it. */
export function ErrorBubble({ error, onRetry, onStartOver }: { error: ChatError; onRetry: () => void; onStartOver: () => void }) {
  return (
    <div role="alert" className="flex items-end gap-2 animate-fade-in">
      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-700">
        <AlertCircle className="h-4 w-4" />
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-bl-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900 sm:max-w-[75%]">
        <p>{error.message}</p>
        {error.kind === "expired" ? (
          <Button type="button" variant="outline" size="sm" className="mt-2 h-9 bg-white" onClick={onStartOver}>
            Start over
          </Button>
        ) : (
          <Button type="button" variant="outline" size="sm" className="mt-2 h-9 bg-white" onClick={onRetry}>
            <RotateCw /> Retry
          </Button>
        )}
      </div>
    </div>
  );
}
