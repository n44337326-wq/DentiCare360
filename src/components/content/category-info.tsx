import { CheckCircle2, ClipboardList, Users } from "lucide-react";
import type { CategoryDetail } from "@/content/site-content";

/** Three short panels under a service category heading: who it's for, what's included, what to expect. */
export function CategoryInfo({ detail }: { detail: CategoryDetail }) {
  return (
    <div className="mt-5 grid gap-4 rounded-xl bg-soft-blue p-5 md:grid-cols-3">
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <Users className="h-4 w-4 text-cyan" aria-hidden="true" /> Who it&apos;s for
        </h3>
        <p className="mt-1.5 text-sm text-navy/80">{detail.whoFor}</p>
      </div>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <CheckCircle2 className="h-4 w-4 text-cyan" aria-hidden="true" /> What&apos;s included
        </h3>
        <ul className="mt-1.5 space-y-1 text-sm text-navy/80">
          {detail.included.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="flex items-center gap-2 text-sm font-semibold text-navy">
          <ClipboardList className="h-4 w-4 text-cyan" aria-hidden="true" /> Before your visit
        </h3>
        <ul className="mt-1.5 space-y-1 text-sm text-navy/80">
          {detail.expect.map((i) => (
            <li key={i}>• {i}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
