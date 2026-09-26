import Link from "next/link";
import { Bot, CalendarPlus, FileText, MessageSquareText, Upload } from "lucide-react";
import { formatShortDate, formatTime12 } from "@/lib/time";
import { formatBytes } from "@/lib/utils";
import type { AiConversationSummary, Appointment, MedicalDocumentItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { AppointmentStatusBadge, UrgencyBadge } from "@/components/shared/status-badge";
import { categoryLabel } from "@/components/patient/document-categories";
import { formatInstantDate, type Loaded } from "@/components/patient/load-safe";

export function SectionHeading({ title, href, linkLabel }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="text-lg font-semibold text-navy">{title}</h2>
      {href && (
        <Link href={href} className="text-sm font-medium text-cyan hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan">
          {linkLabel ?? "View all"}
        </Link>
      )}
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/appointments/book">
          <CalendarPlus aria-hidden="true" /> Book appointment
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/ai-assistant">
          <Bot aria-hidden="true" /> Ask AI assistant
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/patient/documents">
          <Upload aria-hidden="true" /> Upload document
        </Link>
      </Button>
    </div>
  );
}

function AppointmentRow({ appointment: a, showNotes }: { appointment: Appointment; showNotes?: boolean }) {
  return (
    <Card className="transition-all hover:-translate-y-0.5">
      <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="font-medium text-navy">{a.serviceName}</p>
          <p className="text-sm text-muted">
            {a.doctorName} · {formatShortDate(a.date)} at {formatTime12(a.startTime)}
            {a.consultationType === "ONLINE" ? " · Online" : ""}
          </p>
          {showNotes && a.doctorNotes && (
            <p className="mt-1 line-clamp-2 text-sm text-navy">
              <span className="font-medium">Doctor notes: </span>
              {a.doctorNotes}
            </p>
          )}
        </div>
        <AppointmentStatusBadge status={a.status} />
      </CardContent>
    </Card>
  );
}

export function AppointmentRows({
  items,
  emptyTitle,
  emptyDescription,
  showNotes,
}: {
  items: Appointment[];
  emptyTitle: string;
  emptyDescription: string;
  showNotes?: boolean;
}) {
  if (items.length === 0) return <EmptyState title={emptyTitle} description={emptyDescription} className="py-8" />;
  return (
    <ul className="space-y-2">
      {items.map((a) => (
        <li key={a.id}>
          <AppointmentRow appointment={a} showNotes={showNotes} />
        </li>
      ))}
    </ul>
  );
}

export function AiConversationsSection({ result }: { result: Loaded<AiConversationSummary[]> }) {
  if (!result.ok) return <ErrorState message={result.message} />;
  const items = result.data.slice(0, 3);
  if (items.length === 0) {
    return (
      <EmptyState
        icon={MessageSquareText}
        title="No AI conversations yet"
        description="Describe your symptoms to the AI Health Assistant and it will suggest the right specialist."
        action={
          <Button variant="outline" asChild>
            <Link href="/ai-assistant">Ask the AI assistant</Link>
          </Button>
        }
        className="py-8"
      />
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((c) => (
        <li key={c.id}>
          <Card>
            <CardContent className="space-y-2 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-navy">
                  {c.specialtyLabel ?? "General health"}
                  <span className="ml-2 text-sm font-normal text-muted">{formatInstantDate(c.updatedAt)}</span>
                </p>
                <UrgencyBadge urgency={c.urgency} />
              </div>
              {c.summary && (
                <p className="text-sm text-navy">
                  <span className="font-medium">Patient-reported symptoms: </span>
                  <span className="line-clamp-2">{c.summary}</span>
                </p>
              )}
              <p className="text-xs text-muted">
                {c.messageCount} message{c.messageCount === 1 ? "" : "s"}
              </p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export function DocumentsSection({ result }: { result: Loaded<MedicalDocumentItem[]> }) {
  if (!result.ok) return <ErrorState message={result.message} />;
  const items = result.data.slice(0, 4);
  if (items.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No documents uploaded"
        description="Keep reports, prescriptions and dental records together and share them with your doctor."
        action={
          <Button variant="outline" asChild>
            <Link href="/patient/documents">Upload a document</Link>
          </Button>
        }
        className="py-8"
      />
    );
  }
  return (
    <ul className="space-y-2">
      {items.map((d) => (
        <li key={d.id}>
          <Card>
            <CardContent className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-cyan" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-navy">{d.fileName}</p>
                  <p className="text-xs text-muted">
                    {formatBytes(d.sizeBytes)} · {formatInstantDate(d.uploadedAt)}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge variant="outline" className="hidden sm:inline-flex">
                  {categoryLabel(d.category)}
                </Badge>
                <Button size="sm" variant="outline" asChild>
                  <a href={`/api/documents/${d.id}`} target="_blank" rel="noopener">
                    View<span className="sr-only"> {d.fileName}</span>
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
