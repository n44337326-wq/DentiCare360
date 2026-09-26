/** Tappable suggested replies. Each chip sends its own text. */
export function SuggestionChips({ chips, onPick, disabled }: { chips: string[]; onPick: (text: string) => void; disabled?: boolean }) {
  if (chips.length === 0) return null;
  return (
    <div role="group" aria-label="Suggested replies" className="flex flex-wrap gap-2 animate-fade-in">
      {chips.map((chip) => (
        <button
          key={chip}
          type="button"
          disabled={disabled}
          onClick={() => onPick(chip)}
          className="min-h-11 rounded-full border border-cyan/40 bg-white px-4 text-sm font-medium text-navy transition-all hover:-translate-y-0.5 hover:border-cyan hover:bg-cyan-light hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan disabled:pointer-events-none disabled:opacity-50"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
