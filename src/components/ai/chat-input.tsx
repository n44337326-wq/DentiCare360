"use client";

import { useRef, useState, type KeyboardEvent } from "react";
import { SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const MAX_LENGTH = 1000;
const COUNTER_FROM = 800;

/** Message composer: Enter sends, Shift+Enter adds a new line. */
export function ChatInput({ onSend, sending, emergency }: { onSend: (text: string) => void; sending: boolean; emergency: boolean }) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const canSend = value.trim().length > 0 && !sending;

  const resize = () => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 128)}px`;
  };

  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue("");
    requestAnimationFrame(resize);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      {emergency && (
        <p className="text-xs text-red-800">
          You can keep typing, but please get urgent medical help in person first — this chat can&apos;t help in an emergency.
        </p>
      )}
      <Label htmlFor="ai-chat-input" className="sr-only">
        Describe your symptoms or ask a question
      </Label>
      <div className="flex items-end gap-2">
        <textarea
          id="ai-chat-input"
          ref={ref}
          value={value}
          rows={1}
          maxLength={MAX_LENGTH}
          onChange={(e) => {
            setValue(e.target.value);
            resize();
          }}
          onKeyDown={onKeyDown}
          placeholder="Describe what you're experiencing…"
          aria-describedby="ai-chat-hint"
          className="max-h-32 min-h-11 flex-1 resize-none rounded-lg border border-border bg-white px-3 py-2.5 text-base placeholder:text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan sm:text-sm"
        />
        <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={!canSend} aria-label="Send message">
          <SendHorizontal />
        </Button>
      </div>
      <p id="ai-chat-hint" className="flex justify-between text-xs text-slate-600">
        <span>Enter to send · Shift+Enter for a new line</span>
        {value.length >= COUNTER_FROM && (
          <span className={value.length >= MAX_LENGTH ? "font-medium text-red-700" : undefined} aria-live="polite">
            {value.length}/{MAX_LENGTH}
          </span>
        )}
      </p>
    </form>
  );
}
