"use client";

import { useMemo, useState } from "react";
import { Clock, Search, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/states";
import { cn, formatCurrency } from "@/lib/utils";
import type { Service, ServiceCategory, Specialty } from "@/types";
import { ChoiceCard } from "@/components/booking/choice-card";

const CATEGORIES: ServiceCategory[] = ["Dental", "Skin & Dermatology", "General Health"];

export function StepService({
  services,
  specialties,
  selectedId,
  focusSpecialtySlug,
  onSelect,
}: {
  services: Service[];
  specialties: Specialty[];
  selectedId: string | null;
  /** When the visitor arrived with only a specialty, list its services first. */
  focusSpecialtySlug: string | null;
  onSelect: (service: Service) => void;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ServiceCategory | "all">("all");
  const [showAll, setShowAll] = useState(false);

  const focusSpecialty = specialties.find((s) => s.slug === focusSpecialtySlug);
  const scoped = focusSpecialty && !showAll;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const visible = services.filter((s) => {
      if (scoped && s.specialtySlug !== focusSpecialtySlug) return false;
      if (category !== "all" && s.category !== category) return false;
      return !q || `${s.name} ${s.description} ${s.suitableSpecialist}`.toLowerCase().includes(q);
    });
    return CATEGORIES.map((c) => ({ category: c, items: visible.filter((s) => s.category === c) })).filter((g) => g.items.length > 0);
  }, [services, query, category, scoped, focusSpecialtySlug]);

  if (services.length === 0) {
    return <EmptyState title="No services are available right now" description="Please check back soon or contact the clinic to book by phone." icon={Stethoscope} />;
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="relative">
          <Label htmlFor="service-search" className="sr-only">
            Search services
          </Label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input
            id="service-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search services, e.g. acne or check-up"
            className="h-11 pl-9"
          />
        </div>
        <div role="group" aria-label="Filter by category" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={category === c}
              onClick={() => setCategory(c)}
              className={cn(
                "min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
                category === c ? "border-navy bg-navy text-white" : "border-border bg-white text-navy hover:bg-soft-blue"
              )}
            >
              {c === "all" ? "All services" : c}
            </button>
          ))}
        </div>
        {scoped && (
          <p className="flex flex-wrap items-center gap-2 text-sm text-navy" role="status">
            Showing {focusSpecialty.name} services.
            <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setShowAll(true)}>
              Show all services
            </Button>
          </p>
        )}
      </div>

      {groups.length === 0 ? (
        <EmptyState
          title="No services match your search"
          description="Try a different word or clear the filters."
          icon={Search}
          action={
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setQuery("");
                setCategory("all");
                setShowAll(true);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <div role="radiogroup" aria-label="Services" className="space-y-6">
          {groups.map((group) => (
            <section key={group.category} aria-labelledby={`cat-${group.category}`}>
              <h3 id={`cat-${group.category}`} className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-600">
                {group.category}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {group.items.map((service) => (
                  <ChoiceCard
                    key={service.id}
                    name="service"
                    value={service.id}
                    checked={selectedId === service.id}
                    onChange={() => onSelect(service)}
                  >
                    <span className="block font-medium text-navy">{service.name}</span>
                    <span className="mt-0.5 line-clamp-2 block text-sm text-slate-600">{service.description}</span>
                    <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        {service.durationMinutes} min
                      </span>
                      <span className="font-semibold text-navy">from {formatCurrency(service.startingPrice)}</span>
                    </span>
                  </ChoiceCard>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
