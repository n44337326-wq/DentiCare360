import { AssistantAvatar } from "@/components/ai/message-bubble";

/** Three softly pulsing dots. Motion is disabled by the global reduced-motion rule; screen readers hear "Assistant is typing". */
export function TypingIndicator() {
  return (
    <div role="status" className="flex items-end gap-2 animate-fade-in">
      <AssistantAvatar />
      <span className="sr-only">Assistant is typing</span>
      <div aria-hidden="true" className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-white px-4 py-3.5 shadow-sm">
        {[0, 1, 2].map((i) => (
          <span key={i} className="typing-dot h-2 w-2 rounded-full bg-cyan" style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
    </div>
  );
}
