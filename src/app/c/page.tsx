import { asc, eq } from "drizzle-orm";
import { CheckIcon, DownloadIcon, ExternalLinkIcon, LockIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { ThemeToggle } from "@/components/bits";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { invites, submissions } from "@/db/schema";
import { getCandidateInviteId } from "@/lib/candidate-session";
import { deadline, formatDuration, stageDurations, totalStages } from "@/lib/invite";
import { LINK_LABEL } from "@/lib/links";
import { cn } from "@/lib/utils";
import { Countdown } from "./countdown";
import { SubmitForm } from "./submit-form";

export const metadata = { title: "Assessment" };
export const dynamic = "force-dynamic";

export default async function CandidatePage() {
  const inviteId = await getCandidateInviteId();
  if (!inviteId) redirect("/start");
  const invite = await db.query.invites.findFirst({ where: eq(invites.id, inviteId) });
  if (!invite?.snapshot || !invite.startedAt || invite.revokedAt) redirect("/start");

  const subs = await db.query.submissions.findMany({
    where: eq(submissions.inviteId, invite.id),
    orderBy: asc(submissions.stagePosition),
  });
  const snap = invite.snapshot;
  const current = subs.length;
  const total = totalStages(invite);
  const finished = current >= total;
  const durations = stageDurations(invite, subs);

  // Position 0 is the initial prompt; follow-ups are 1..n.
  const tasks = [{ position: 0, title: "Initial prompt", body: snap.prompt }, ...snap.stages];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background/80 px-5 backdrop-blur">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-semibold tracking-tight">{snap.title}</span>
          <span className="text-muted-foreground">{invite.candidateName}</span>
        </div>
        <div className="flex items-center gap-3">
          {!finished && (
            <Countdown startedAt={invite.startedAt.toISOString()} deadline={deadline(invite)?.toISOString() ?? null} />
          )}
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-5xl flex-1 gap-10 px-5 py-10">
        <aside className="hidden w-56 shrink-0 md:block">
          <div className="sticky top-24 space-y-6">
            <ol className="space-y-1">
              {tasks.map((t) => {
                const done = t.position < current;
                const active = t.position === current && !finished;
                return (
                  <li
                    key={t.position}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm",
                      active && "bg-muted font-medium",
                      !done && !active && "text-muted-foreground",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-4 shrink-0 items-center justify-center rounded-full border text-[10px]",
                        done && "border-emerald-500 bg-emerald-500 text-white",
                        active && "border-primary text-primary",
                      )}
                    >
                      {done ? <CheckIcon className="size-2.5" /> : active ? t.position + 1 : <LockIcon className="size-2.5" />}
                    </span>
                    <span className="truncate">{done || active ? t.title : `Task ${t.position + 1}`}</span>
                  </li>
                );
              })}
            </ol>
            {(snap.starterUrl || snap.starterRepoUrl) && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <div className="px-2 text-xs font-medium text-muted-foreground">Starter code</div>
                  {snap.starterUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      render={<a href={snap.starterUrl} download />}
                    >
                      <DownloadIcon /> Download zip
                    </Button>
                  )}
                  {snap.starterRepoUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      render={<a href={snap.starterRepoUrl} target="_blank" rel="noreferrer" />}
                    >
                      <ExternalLinkIcon /> Template repo
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-12">
          {finished ? (
            <section className="space-y-3">
              <h1 className="text-2xl font-semibold tracking-tight">All done. Thank you.</h1>
              <p className="text-sm text-muted-foreground">
                Your work has been submitted. Total time:{" "}
                {formatDuration(invite.finishedAt!.getTime() - invite.startedAt.getTime())}. We will be in touch
                about next steps.
              </p>
            </section>
          ) : (
            <section className="space-y-6">
              <div className="space-y-1">
                <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
                  Task {current + 1} of {total}
                </div>
                <h1 className="text-2xl font-semibold tracking-tight">{tasks[current].title}</h1>
              </div>
              <Markdown>{tasks[current].body}</Markdown>
              <Separator />
              <SubmitForm stagePosition={current} isLast={current + 1 >= total} />
            </section>
          )}

          {subs.length > 0 && (
            <section className="space-y-6">
              <h2 className="text-sm font-medium text-muted-foreground">Submitted</h2>
              {[...subs].reverse().map((s) => (
                <details key={s.id} className="group rounded-lg border">
                  <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm">
                    <span className="font-medium">
                      {s.stagePosition + 1}. {tasks[s.stagePosition]?.title}
                    </span>
                    <span className="text-xs text-muted-foreground">{formatDuration(durations[s.stagePosition])}</span>
                  </summary>
                  <div className="space-y-4 border-t px-4 py-4">
                    <Markdown className="text-muted-foreground">{tasks[s.stagePosition]?.body ?? ""}</Markdown>
                    <Separator />
                    <ul className="space-y-1 text-sm">
                      {s.links.map((l, i) => (
                        <li key={i} className="flex gap-2">
                          <span className="w-32 shrink-0 text-muted-foreground">
                            {LINK_LABEL[l.type]}
                          </span>
                          <a href={l.url} className="truncate text-primary underline-offset-4 hover:underline" target="_blank" rel="noreferrer">
                            {l.url}
                          </a>
                        </li>
                      ))}
                    </ul>
                    {s.notes && <Markdown>{s.notes}</Markdown>}
                  </div>
                </details>
              ))}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
