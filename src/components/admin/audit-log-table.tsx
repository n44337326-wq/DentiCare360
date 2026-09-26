import { ScrollText } from "lucide-react";
import type { AuditLogEntry } from "@/services/admin";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { formatDateTime } from "@/components/admin/format";

const who = (e: AuditLogEntry) => (e.userName ? `${e.userName}${e.userEmail ? ` (${e.userEmail})` : ""}` : "System / anonymous");

/** Recent audit entries. Only who / what / where / when — never the entry's metadata. */
export function AuditLogTable({ entries }: { entries: AuditLogEntry[] }) {
  if (entries.length === 0) {
    return <EmptyState icon={ScrollText} title="No audit entries yet" description="Sign-ins, record views and changes will be listed here." />;
  }
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border bg-white md:block">
        <table className="w-full min-w-[44rem] text-left text-sm">
          <caption className="sr-only">Recent audit log</caption>
          <thead className="bg-soft-blue text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th scope="col" className="px-4 py-3">When</th>
              <th scope="col" className="px-4 py-3">Action</th>
              <th scope="col" className="px-4 py-3">Record</th>
              <th scope="col" className="px-4 py-3">User</th>
              <th scope="col" className="px-4 py-3">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {entries.map((e) => (
              <tr key={e.id}>
                <td className="whitespace-nowrap px-4 py-2.5 text-slate-700">{formatDateTime(e.createdAt)}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-navy">{e.action}</td>
                <td className="px-4 py-2.5 text-slate-700">
                  {e.entityType}
                  {e.entityId && <span className="block max-w-40 truncate font-mono text-[11px] text-slate-500" title={e.entityId}>{e.entityId}</span>}
                </td>
                <td className="px-4 py-2.5 text-slate-700">{who(e)}</td>
                <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{e.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 md:hidden">
        {entries.map((e) => (
          <li key={e.id}>
            <Card>
              <CardContent className="space-y-1 p-4 text-sm">
                <p className="font-mono text-xs font-medium text-navy">{e.action}</p>
                <p className="text-slate-700">{e.entityType}{e.entityId ? ` · ${e.entityId.slice(0, 12)}…` : ""}</p>
                <p className="text-slate-700">{who(e)}</p>
                <p className="text-xs text-slate-600">{formatDateTime(e.createdAt)}{e.ipAddress ? ` · ${e.ipAddress}` : ""}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </>
  );
}
