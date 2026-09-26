import { ChevronDown } from "lucide-react";
import type { FaqItem } from "@/content/site-content";

/**
 * Accessible FAQ built on native <details>/<summary>: keyboard operable, works
 * without JavaScript, and screen readers announce expanded state.
 */
export function Faq({
  items,
  title = "Frequently asked questions",
  description,
  id = "faq",
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
  id?: string;
}) {
  return (
    <section aria-labelledby={`${id}-heading`} className="mx-auto max-w-3xl">
      <h2 id={`${id}-heading`} className="text-2xl font-semibold text-navy">
        {title}
      </h2>
      {description && <p className="mt-1.5 text-navy/75">{description}</p>}
      <div className="mt-5 divide-y divide-border rounded-xl border border-border bg-white">
        {items.map((item) => (
          <details key={item.q} className="group px-5 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-medium text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan [&::-webkit-details-marker]:hidden">
              {item.q}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-cyan transition-transform group-open:rotate-180 motion-reduce:transition-none"
                aria-hidden="true"
              />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-navy/80">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
