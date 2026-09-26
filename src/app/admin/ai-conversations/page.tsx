import Link from "next/link";
import { MessagesSquare, SearchX } from "lucide-react";
import type { AiConversationSummary, UrgencyLevel } from "@/types";
import { cn } from "@/lib/utils";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { UrgencyBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/components/admin/format";
import { SensitiveNotice } from "@/components/admin/sensitive-notice";
import { PageHeader } from "@/components/doctor/page-header";
import { listAllConversations } from "@/services/ai";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "AI Conversations — Admin" };
export const dynamic = "force-dynamic";

const FILTERS: { value: UrgencyLevel | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "EMERGENCY", label: "Emergency" },
  { value: "HIGH", label: "Urgent" },
  { value: "MODERATE", label: "Moderate" },
  { value: "LOW", label: "Routine" },
];

export default async function AdminAiConversationsPage({ searchParams }: { searchParams: Promise<{ urgency?: string }> }) {
  const user = await requireAdminUser();
  const { urgency } = await searchParams;
  const active = FILTERS.find((f) => f.value === urgency)?.value ?? "ALL";

  let conversations: AiConversationSummary[] | null = null;
  try {
    conversations = await listAllConversations(user);
  } catch (err) {
    console.error("[admin/ai-conversations] failed to load", err);
  }
  const shown = conversations?.filter((c) => active === "ALL" || c.urgency === active) ?? [];

  return (
    <div>
      <PageHeader title="AI conversations" description="Chats with the AI Health Assistant, from signed-in patients and guests. Most recent 100." />
      <SensitiveNotice />

      <nav aria-label="Filter by urgency" className="mb-5 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={f.value === "ALL" ? "/admin/ai-conversations" : `/admin/ai-conversations?urgency=${f.value}`}
            aria-current={active === f.value ? "page" : undefined}
            className={cn(
              "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
              active === f.value ? "border-navy bg-navy text-white" : "border-border bg-white text-navy hover:bg-soft-blue"
            )}
          >
            {f.label}
          </Link>
        ))}
      </nav>

      {!conversations ? (
        <ErrorState message="We couldn't load the conversations. Please refresh the page to try again." />
      ) : conversations.length === 0 ? (
        <EmptyState icon={MessagesSquare} title="No conversations yet" description="Conversations appear here once someone chats with the assistant." />
      ) : shown.length === 0 ? (
        <EmptyState icon={SearchX} title="No conversations with this urgency" description="Choose another filter to see more conversations." />
      ) : (
        <ul className="space-y-2">
          {shown.map((c) => (
            <li key={c.id}>
              <Link
                href={`/admin/ai-conversations/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-white px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
              >
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-medium text-navy">{c.patientName ?? "Guest"}</p>
                  <p className="truncate text-sm text-slate-600">{c.specialtyLabel ?? "No specialty identified"}</p>
                  {c.summary && <p className="mt-1 line-clamp-2 text-xs text-slate-600">{c.summary}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 text-xs text-slate-600">
                  <UrgencyBadge urgency={c.urgency} />
                  <span>{c.messageCount} messages</span>
                  <span>{formatDateTime(c.updatedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
