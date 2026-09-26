
import { Building2, Stethoscope, Video } from "lucide-react";
import type { Doctor } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { DoctorAvatar } from "@/components/shared/doctor-avatar";
import { DoctorActions } from "@/components/admin/doctor-actions";

function StatusBadges({ doctor: d }: { doctor: Doctor }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge variant={d.isActive ? "success" : "destructive"}>{d.isActive ? "Active" : "Inactive"}</Badge>
      {d.isTemporarilyUnavailable && (
        <Badge variant="warning" title={d.unavailableReason}>
          Unavailable{d.unavailableReason ? `: ${d.unavailableReason}` : ""}
        </Badge>
      )}
    </div>
  );
}

function Modes({ doctor: d }: { doctor: Doctor }) {
  return (
    <div className="flex flex-wrap gap-1.5 text-xs text-slate-700">
      {d.supportsInPerson && (
        <span className="inline-flex items-center gap-1"><Building2 className="h-3.5 w-3.5" aria-hidden="true" /> In person</span>
      )}
      {d.supportsOnline && (
        <span className="inline-flex items-center gap-1"><Video className="h-3.5 w-3.5" aria-hidden="true" /> Online</span>
      )}
    </div>
  );
}

const Identity = ({ doctor: d }: { doctor: Doctor }) => (
  <div className="flex min-w-0 items-center gap-3">
    <DoctorAvatar name={d.name} photoUrl={d.photoUrl} size="sm" />
    <div className="min-w-0">
      <p className="truncate font-medium text-navy">{d.name}</p>
      <p className="truncate text-xs text-slate-600">{d.specialtyName}</p>
    </div>
  </div>
);

/** Every doctor (including inactive): a table on tablet/desktop, stacked cards on phones. */
export function DoctorsTable({ doctors }: { doctors: Doctor[] }) {
  if (doctors.length === 0) {
    return <EmptyState icon={Stethoscope} title="No doctors yet" description="Use “Add doctor” to create the first doctor account." />;
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <caption className="sr-only">All doctors</caption>
          <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">Doctor</th>
              <th scope="col" className="px-4 py-3">Fee</th>
              <th scope="col" className="px-4 py-3">Consultations</th>
              <th scope="col" className="px-4 py-3">Status</th>
              <th scope="col" className="px-4 py-3">Bookings</th>
              <th scope="col" className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {doctors.map((d) => (
              <tr key={d.id} className={d.isActive ? undefined : "bg-slate-50/70"}>
                <td className="px-4 py-3"><Identity doctor={d} /></td>
                <td className="px-4 py-3 font-medium tabular-nums text-navy">{formatCurrency(d.consultationFee)}</td>
                <td className="px-4 py-3"><Modes doctor={d} /></td>
                <td className="px-4 py-3"><StatusBadges doctor={d} /></td>
                <td className="px-4 py-3 text-xs text-slate-700">{d.autoConfirm ? "Auto-confirm" : "Needs acceptance"}</td>
                <td className="px-4 py-3"><DoctorActions doctor={d} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden">
        {doctors.map((d) => (
          <li key={d.id}>
            <Card>
              <CardContent className="space-y-3 p-4">
                <Identity doctor={d} />
                <StatusBadges doctor={d} />
                <dl className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <dt className="text-xs text-slate-600">Fee</dt>
                    <dd className="font-medium tabular-nums text-navy">{formatCurrency(d.consultationFee)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-slate-600">Bookings</dt>
                    <dd className="text-navy">{d.autoConfirm ? "Auto-confirm" : "Needs acceptance"}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-xs text-slate-600">Consultations</dt>
                    <dd><Modes doctor={d} /></dd>
                  </div>
                </dl>
                <DoctorActions doctor={d} />
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
