"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/** Add/remove tag list (allergies, medications). Enter or comma adds; each tag has its own remove button. */
export function TagListField({
  id,
  label,
  hint,
  placeholder,
  values,
  onChange,
  maxItems,
  maxLength,
  error,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  placeholder?: string;
  values: string[];
  onChange: (next: string[]) => void;
  maxItems: number;
  maxLength: number;
  error?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState<string | null>(null);

  function add() {
    const value = draft.trim().replace(/,+$/, "").trim();
    if (!value) return;
    if (values.some((v) => v.toLowerCase() === value.toLowerCase())) {
      setNote(`"${value}" is already in the list.`);
      return;
    }
    if (values.length >= maxItems) {
      setNote(`You can add up to ${maxItems} items.`);
      return;
    }
    setNote(null);
    onChange([...values, value]);
    setDraft("");
  }

  const describedBy = [hint ? `${id}-hint` : null, error || note ? `${id}-msg` : null].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      {hint && (
        <p id={`${id}-hint`} className="mt-0.5 text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5 flex gap-2">
        <Input
          id={id}
          value={draft}
          maxLength={maxLength}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => {
            setDraft(e.target.value);
            setNote(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={add} disabled={disabled || !draft.trim()}>
          <Plus aria-hidden="true" /> Add
        </Button>
      </div>
      {(error || note) && (
        <p id={`${id}-msg`} role={error ? "alert" : "status"} className={`mt-1 text-xs ${error ? "text-red-700" : "text-muted"}`}>
          {error ?? note}
        </p>
      )}
      {values.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label={`${label} list`}>
          {values.map((v) => (
            <li key={v} className="inline-flex items-center gap-1 rounded-full bg-soft-blue py-1 pl-3 pr-1 text-sm text-navy">
              {v}
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange(values.filter((x) => x !== v))}
                className="rounded-full p-1 text-navy/70 transition-colors hover:bg-white hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="sr-only">Remove {v}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-muted">Nothing added yet.</p>
      )}
    </div>
  );
}
