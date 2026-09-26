import { Bot, UserRound } from "lucide-react";
import type { AiChatMessage } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/shared/states";
import { formatDateTime } from "@/components/admin/format";

/** Read-only chat transcript in a bubble layout. Speaker is shown as text, not only by colour or side. */
export function Transcript({ messages }: { messages: AiChatMessage[] }) {
  if (messages.length === 0) return <EmptyState title="No messages in this conversation" />;
  return (
    <ol className="space-y-4" aria-label="Conversation transcript">
      {messages.map((m) => {
        const patient = m.sender === "PATIENT";
        return (
          <li key={m.id} className={cn("flex", patient ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%] sm:max-w-[75%]", patient && "text-right")}>
              <p className={cn("mb-1 flex items-center gap-1 text-xs font-medium text-slate-600", patient && "justify-end")}>
                {patient ? <UserRound className="h-3 w-3" aria-hidden="true" /> : <Bot className="h-3 w-3" aria-hidden="true" />}
                {patient ? "Patient / guest" : "AI Health Assistant"} · {formatDateTime(m.createdAt)}
              </p>
              <p
                className={cn(
                  "whitespace-pre-line rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed",
                  patient ? "rounded-tr-sm bg-navy text-white" : "rounded-tl-sm bg-soft-blue text-navy"
                )}
              >
                {m.content}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
