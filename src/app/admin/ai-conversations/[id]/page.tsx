import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { NotFoundError } from "@/lib/errors";
import type { AiConversationSummary } from "@/types";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ErrorState } from "@/components/shared/states";
import { UrgencyBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/components/admin/format";
import { SensitiveNotice } from "@/components/admin/sensitive-notice";
import { Transcript } from "@/components/admin/transcript";
import { PageHeader } from "@/components/doctor/page-header";
import { getConversationForAdmin } from "@/services/ai";
import { requireAdminUser } from "@/app/admin/_guard";

export const metadata = { title: "AI conversation — Admin" };
export const dynamic = "force-dynamic";

export default async function AdminAiConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireAdminUser();
  const { id } = await params;
  const ip = (await headers()).get("x-forwarded-for")?.split(",")[0]?.trim() || undefined;

  let conversation: AiConversationSummary | null = null;
  let missing = false;
  try {
    conversation = await getConversationForAdmin(user, id, ip);
  } catch (err) {
    if (err instanceof NotFoundError) missing = true;
    else console.error("[admin/ai-conversations] failed to load", err);
  }
  if (missing) notFound();

  const back = (
    <Link href="/admin/ai-conversations" className={buttonVariants({ variant: "ghost", size: "sm", className: "mb-4 -ml-3" })}>
      <ArrowLeft aria-hidden="true" /> Back to conversations
    </Link>
  );

  if (!conversation) {
    return (
      <div>
        {back}
        <ErrorState message="We couldn't load this conversation. Please refresh the page to try again." />
      </div>
    );
  }

  return (
    <div>
      {back}
      <PageHeader
        title={`Conversation with ${conversation.patientName ?? "Guest"}`}
        description={`Started ${formatDateTime(conversation.createdAt)} · last activity ${formatDateTime(conversation.updatedAt)}`}
        actions={<UrgencyBadge urgency={conversation.urgency} />}
      />
      <SensitiveNotice />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Transcript</CardTitle>
          </CardHeader>
          <CardContent>
            <Transcript messages={conversation.messages ?? []} />
          </CardContent>
        </Card>

        <div className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs text-slate-600">Patient</dt>
                  <dd className="font-medium text-navy">{conversation.patientName ?? "Guest (not signed in)"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Suggested specialty</dt>
                  <dd className="text-navy">{conversation.specialtyLabel ?? "Not identified"}</dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Urgency</dt>
                  <dd><UrgencyBadge urgency={conversation.urgency} /></dd>
                </div>
                <div>
                  <dt className="text-xs text-slate-600">Messages</dt>
                  <dd className="text-navy">{conversation.messageCount}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card className="border-cyan/30 bg-cyan-light/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Patient-reported symptoms — not a confirmed diagnosis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line text-sm text-navy">
                {conversation.summary ?? "No summary has been generated for this conversation."}
              </p>
              <p className="mt-2 text-xs text-slate-700">
                Generated from what the patient wrote to the AI Health Assistant. It is not medical advice or a diagnosis.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
