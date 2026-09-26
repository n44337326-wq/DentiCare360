"use client";

import { useMemo, useState } from "react";
import { SearchX, Search, Users } from "lucide-react";
import type { PatientSummary } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/shared/states";
import { formatInstantDate } from "@/components/admin/format";

/** Searchable patient directory. Contact and activity only — medical records are not reachable from here. */
export function PatientsDirectory({ patients }: { patients: PatientSummary[] }) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const shown = useMemo(
    () =>
      q
        ? patients.filter((p) => [p.name, p.email, p.phone ?? ""].some((v) => v.toLowerCase().includes(q)))
        : patients,
    [patients, q]
  );

  if (patients.length === 0) {
    return <EmptyState icon={Users} title="No patients yet" description="Patients appear here after they register." />;
  }

  return (
    <div className="space-y-4">
      <div className="max-w-sm space-y-1.5">
        <Label htmlFor="patient-search">Search patients</Label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" aria-hidden="true" />
          <Input
            id="patient-search"
            type="search"
            className="pl-9"
            placeholder="Name, email or phone"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>
      <p className="text-sm text-slate-600" aria-live="polite">
        Showing {shown.length} of {patients.length} patient{patients.length === 1 ? "" : "s"}
      </p>

      {shown.length === 0 ? (
        <EmptyState icon={SearchX} title="No patients match your search" description="Try a different name, email address or phone number." />
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <caption className="sr-only">Patient directory</caption>
              <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th scope="col" className="px-4 py-3">Patient</th>
                  <th scope="col" className="px-4 py-3">Phone</th>
                  <th scope="col" className="px-4 py-3 text-right">Appointments</th>
                  <th scope="col" className="px-4 py-3">Last visit</th>
                  <th scope="col" className="px-4 py-3">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shown.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-navy">{p.name}</p>
                      <p className="text-xs text-slate-600">{p.email}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{p.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.appointmentCount}</td>
                    <td className="px-4 py-3 text-slate-700">{p.lastVisit ? formatDate(p.lastVisit) : "—"}</td>
                    <td className="px-4 py-3 text-slate-700">{formatInstantDate(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <ul className="space-y-3 md:hidden">
            {shown.map((p) => (
              <li key={p.id}>
                <Card>
                  <CardContent className="space-y-2 p-4">
                    <div>
                      <p className="font-medium text-navy">{p.name}</p>
                      <p className="break-all text-xs text-slate-600">{p.email}</p>
                    </div>
                    <dl className="grid grid-cols-2 gap-2 text-sm">
                      <div><dt className="text-xs text-slate-600">Phone</dt><dd>{p.phone ?? "—"}</dd></div>
                      <div><dt className="text-xs text-slate-600">Appointments</dt><dd>{p.appointmentCount}</dd></div>
                      <div><dt className="text-xs text-slate-600">Last visit</dt><dd>{p.lastVisit ? formatDate(p.lastVisit) : "—"}</dd></div>
                      <div><dt className="text-xs text-slate-600">Joined</dt><dd>{formatInstantDate(p.createdAt)}</dd></div>
                    </dl>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
