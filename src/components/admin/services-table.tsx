"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Loader2, Pencil, Plus, Power, PowerOff } from "lucide-react";
import type { Service, Specialty } from "@/types";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { useAsyncAction } from "@/hooks/use-async-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, InlineAlert } from "@/components/shared/states";
import { ServiceDialog } from "@/components/admin/service-dialog";

function ServiceActions({ service, onEdit, onToggle, busy }: { service: Service; onEdit: () => void; onToggle: () => void; busy: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Button size="sm" variant="outline" onClick={onEdit}>
        <Pencil aria-hidden="true" /> Edit<span className="sr-only"> {service.name}</span>
      </Button>
      <Button size="sm" variant={service.isActive ? "ghost" : "secondary"} disabled={busy} onClick={onToggle} className={service.isActive ? "text-red-700 hover:bg-red-50" : undefined}>
        {busy ? <Loader2 className="animate-spin motion-reduce:animate-none" aria-hidden="true" /> : service.isActive ? <PowerOff aria-hidden="true" /> : <Power aria-hidden="true" />}
        {service.isActive ? "Deactivate" : "Activate"}
        <span className="sr-only"> {service.name}</span>
      </Button>
    </div>
  );
}

/** All services (incl. inactive) with add / edit dialogs and a quick activate-deactivate toggle. */
export function ServicesTable({ services, specialties }: { services: Service[]; specialties: Specialty[] }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<{ service: Service | null } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const toggle = useCallback(async (s: Service) => {
    setBusyId(s.id);
    try {
      await apiFetch(`/api/admin/services/${s.id}`, { method: "PATCH", json: { isActive: !s.isActive } });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }, [router]);
  const { run, error } = useAsyncAction(toggle);

  const specialtyName = (slug: string) => specialties.find((s) => s.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setDialog({ service: null })}>
          <Plus aria-hidden="true" /> Add service
        </Button>
      </div>
      {error && <InlineAlert variant="error">{error}</InlineAlert>}

      {services.length === 0 ? (
        <EmptyState icon={ClipboardList} title="No services yet" description="Add the first service patients can book." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <caption className="sr-only">All services</caption>
              <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Service</th>
                  <th scope="col" className="px-4 py-3">Specialty</th>
                  <th scope="col" className="px-4 py-3">Duration</th>
                  <th scope="col" className="px-4 py-3">From</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {services.map((s) => (
                  <tr key={s.id} className={s.isActive ? undefined : "bg-slate-50/70"}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{s.name}</p>
                      <p className="text-xs text-slate-600">{s.category}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{specialtyName(s.specialtySlug)}</td>
                    <td className="px-4 py-3 tabular-nums text-slate-700">{s.durationMinutes} min</td>
                    <td className="px-4 py-3 font-medium tabular-nums text-navy">{formatCurrency(s.startingPrice)}</td>
                    <td className="px-4 py-3"><Badge variant={s.isActive ? "success" : "outline"}>{s.isActive ? "Active" : "Inactive"}</Badge></td>
                    <td className="px-4 py-3">
                      <ServiceActions service={s} busy={busyId === s.id} onEdit={() => setDialog({ service: s })} onToggle={() => run(s)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {services.map((s) => (
              <li key={s.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-navy">{s.name}</p>
                        <p className="text-xs text-slate-600">{s.category} · {specialtyName(s.specialtySlug)}</p>
                      </div>
                      <Badge variant={s.isActive ? "success" : "outline"}>{s.isActive ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="text-sm text-slate-700">{s.durationMinutes} min · from {formatCurrency(s.startingPrice)}</p>
                    <ServiceActions service={s} busy={busyId === s.id} onEdit={() => setDialog({ service: s })} onToggle={() => run(s)} />
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}

      {dialog && <ServiceDialog service={dialog.service} specialties={specialties} onClose={() => setDialog(null)} />}
    </div>
  );
}
