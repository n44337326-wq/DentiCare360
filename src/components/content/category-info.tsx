import { CheckCircle2, ClipboardList, Users } from "lucide-react";
import type { CategoryDetail } from "@/content/site-content";
import "./services.css";

/** Three short columns under a service category heading: who it's for, what's included, what to expect. */
export function CategoryInfo({ detail }: { detail: CategoryDetail }) {
  return (
    <div className="svc-info svc-reveal mt-6 grid gap-8 p-6 sm:p-8 md:grid-cols-3 md:gap-0 md:divide-x md:divide-cyan/20">
      <div className="svc-info-col md:pr-8">
        <span className="svc-info-icon">
          <Users className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h3 className="mt-3 text-base font-bold text-navy">Who it&apos;s for</h3>
        <p className="mt-2 text-sm leading-relaxed text-navy/80">{detail.whoFor}</p>
      </div>
      <div className="svc-info-col md:px-8">
        <span className="svc-info-icon">
          <CheckCircle2 className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h3 className="mt-3 text-base font-bold text-navy">What&apos;s included</h3>
        <ul className="mt-2 space-y-2 text-sm text-navy/80">
          {detail.included.map((item, i) => (
            <li key={item} className="svc-bullet flex items-start gap-2" style={{ animationDelay: `${i * 90}ms` }}>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="svc-info-col md:pl-8">
        <span className="svc-info-icon">
          <ClipboardList className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <h3 className="mt-3 text-base font-bold text-navy">Before your visit</h3>
        <ul className="mt-2 space-y-2 text-sm text-navy/80">
          {detail.expect.map((item, i) => (
            <li key={item} className="svc-bullet flex items-start gap-2" style={{ animationDelay: `${i * 90}ms` }}>
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
