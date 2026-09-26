import Link from "next/link";
import { Repeat } from "lucide-react";
import type { Appointment } from "@/types";
import { formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";

const snippet = (text: string, max = 110) => (text.length > max ? `${text.slice(0, max).trimEnd()}…` : text);

/** Patients seen recently who have nothing booked with this doctor — candidates for a follow-up. */
export function FollowUpsCard({ followUps }: { followUps: Appointment[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Repeat className="h-5 w-5 text-cyan" aria-hidden="true" /> Follow-ups
        </CardTitle>
        <p className="text-sm text-slate-600">Completed in the last 60 days, with no upcoming appointment booked.</p>
      </CardHeader>
      <CardContent>
        {followUps.length === 0 ? (
          <EmptyState title="No follow-ups needed" description="Recently seen patients all have a next appointment, or none were seen lately." />
        ) : (
          <ul className="divide-y divide-border">
            {followUps.map((a) => (
              <li key={a.patientId} className="flex flex-wrap items-start justify-between gap-2 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-medium text-navy">{a.patientName}</p>
                  <p className="text-xs text-slate-600">
                    Last visit {formatDate(a.date)} · {a.serviceName}
                  </p>
                  {a.doctorNotes && <p className="mt-1 text-sm text-slate-700">“{snippet(a.doctorNotes)}”</p>}
                </div>
                <Link
                  href={`/doctor/patients/${a.patientId}`}
                  className="text-sm font-medium text-cyan underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
                >
                  View patient<span className="sr-only"> {a.patientName}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
