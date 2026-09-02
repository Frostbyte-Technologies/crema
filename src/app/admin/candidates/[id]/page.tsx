import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CopyButton, StatusBadge } from "@/components/bits";
import { Markdown } from "@/components/markdown";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { assessments, invites, reviews, submissions } from "@/db/schema";
import { deadline, formatDuration, inviteStatus, lateBy, stageDurations, totalStages } from "@/lib/invite";
import { PageHeader } from "../../page-header";
import { CopyInviteLink, InviteActions } from "./invite-actions";
import { LinkRow } from "./link-row";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

const DECISION_LABEL = { strong_yes: "Strong yes", yes: "Yes", no: "No", strong_no: "Strong no" } as const;

export default async function CandidatePage({ params }: PageProps<"/admin/candidates/[id]">) {
  const { id } = await params;
  const session = await auth();
  const me = session?.user?.email ?? "";

  const invite = await db.query.invites.findFirst({ where: eq(invites.id, id) });
  if (!invite) notFound();
  const [assessment, subs, revs] = await Promise.all([
    db.query.assessments.findFirst({ where: eq(assessments.id, invite.assessmentId) }),
    db.query.submissions.findMany({ where: eq(submissions.inviteId, id), orderBy: asc(submissions.stagePosition) }),
    db.query.reviews.findMany({ where: eq(reviews.inviteId, id), orderBy: asc(reviews.updatedAt) }),
  ]);

  const status = inviteStatus(invite, revs.length);
  const snap = invite.snapshot;
  const tasks = snap ? [{ position: 0, title: "Initial prompt", body: snap.prompt }, ...snap.stages] : [];
  const durations = stageDurations(invite, subs);
  const due = deadline(invite);
  const totalLate = lateBy(invite, invite.finishedAt);
  const mine = revs.find((r) => r.reviewerEmail === me);

  return (
    <>
      <PageHeader crumbs={[{ label: "Candidates", href: "/admin/candidates" }, { label: invite.candidateName }]}>
        <InviteActions id={invite.id} revoked={!!invite.revokedAt} finished={!!invite.finishedAt} />
      </PageHeader>

      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">{invite.candidateName}</h1>
              <StatusBadge status={status} />
            </div>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-4">
              <Meta label="Email">{invite.email || "–"}</Meta>
              <Meta label="Assessment">{assessment?.title ?? "–"}</Meta>
              <Meta label="Started">{invite.startedAt ? invite.startedAt.toLocaleString() : "Not yet"}</Meta>
              <Meta label="Total time">
                {invite.startedAt
                  ? formatDuration((invite.finishedAt ?? new Date()).getTime() - invite.startedAt.getTime())
                  : "–"}
                {totalLate > 0 && <span className="ml-1 text-destructive">({formatDuration(totalLate)} late)</span>}
              </Meta>
              {due && <Meta label="Deadline">{due.toLocaleString()}</Meta>}
              <Meta label="Invited by">{invite.createdBy || "–"}</Meta>
            </dl>
            {!invite.startedAt && !invite.revokedAt && (
              <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/40 p-3 text-sm">
                <span className="text-muted-foreground">Invite code</span>
                <code className="font-mono text-base tracking-widest">{invite.code}</code>
                <CopyButton value={invite.code} label="Copy code" />
                <CopyInviteLink code={invite.code} />
              </div>
            )}
          </section>

          <section className="space-y-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Progress {snap ? `· ${subs.length} / ${totalStages(invite)}` : ""}
            </h2>
            {!snap && <p className="text-sm text-muted-foreground">Nothing yet. Stages appear once the candidate signs in.</p>}
            <ol className="space-y-3">
              {tasks.map((t) => {
                const sub = subs.find((s) => s.stagePosition === t.position);
                const isCurrent = !sub && t.position === subs.length && !invite.finishedAt;
                const late = sub ? lateBy(invite, sub.submittedAt) : 0;
                return (
                  <li key={t.position} className="rounded-lg border">
                    <div className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{t.position + 1}.</span>
                        <span className="font-medium">{t.title}</span>
                        {isCurrent && <span className="text-xs text-amber-600 dark:text-amber-400">in progress</span>}
                      </div>
                      {sub && (
                        <div className="text-xs text-muted-foreground">
                          {formatDuration(durations[t.position])}
                          {late > 0 && <span className="ml-1 text-destructive">+{formatDuration(late)} late</span>}
                          <span className="mx-1.5">·</span>
                          {sub.submittedAt.toLocaleString()}
                        </div>
                      )}
                    </div>
                    <details className="border-t">
                      <summary className="cursor-pointer px-4 py-2 text-xs text-muted-foreground hover:text-foreground">
                        Task description
                      </summary>
                      <Markdown className="px-4 pb-4">{t.body}</Markdown>
                    </details>
                    {sub && (
                      <div className="space-y-4 border-t px-4 py-4">
                        <ul className="space-y-2">
                          {sub.links.map((l, i) => (
                            <LinkRow key={i} link={l} />
                          ))}
                        </ul>
                        {sub.notes && (
                          <>
                            <Separator />
                            <Markdown>{sub.notes}</Markdown>
                          </>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </section>
        </div>

        <aside className="space-y-8">
          <section className="space-y-3">
            <h2 className="text-sm font-medium text-muted-foreground">Your review</h2>
            <ReviewForm
              inviteId={invite.id}
              stages={tasks.map((t) => ({ position: t.position, title: t.title }))}
              existing={mine ? { scores: mine.scores, notes: mine.notes, decision: mine.decision } : null}
            />
          </section>
          {revs.filter((r) => r.reviewerEmail !== me).length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground">Other reviews</h2>
              {revs
                .filter((r) => r.reviewerEmail !== me)
                .map((r) => (
                  <div key={r.id} className="space-y-2 rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{r.reviewerName || r.reviewerEmail}</span>
                      {r.decision && <span className="text-xs text-muted-foreground">{DECISION_LABEL[r.decision]}</span>}
                    </div>
                    {Object.keys(r.scores).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 text-xs text-muted-foreground">
                        {tasks.map((t) =>
                          r.scores[t.position] ? (
                            <span key={t.position} className="rounded bg-muted px-1.5 py-0.5">
                              {t.position + 1}: {r.scores[t.position]}/5
                            </span>
                          ) : null,
                        )}
                      </div>
                    )}
                    {r.notes && <Markdown className="text-muted-foreground">{r.notes}</Markdown>}
                  </div>
                ))}
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="truncate">{children}</dd>
    </div>
  );
}
