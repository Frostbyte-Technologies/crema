import { asc, count, desc, eq, sql } from "drizzle-orm";
import Link from "next/link";
import { StatusBadge } from "@/components/bits";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { assessments, invites, reviews, submissions } from "@/db/schema";
import { formatDuration, inviteStatus, STATUS_LABEL, totalStages, type InviteStatus } from "@/lib/invite";
import { cn } from "@/lib/utils";
import { PageHeader } from "../page-header";
import { NewInviteDialog } from "./new-invite-dialog";

export const metadata = { title: "Candidates" };
export const dynamic = "force-dynamic";

const FILTERS: (InviteStatus | "all")[] = ["all", "in_progress", "submitted", "reviewed", "invited"];

export default async function CandidatesPage({ searchParams }: PageProps<"/admin/candidates">) {
  const { status: filter = "all" } = await searchParams;

  const subCount = db
    .select({ inviteId: submissions.inviteId, n: count().as("n") })
    .from(submissions)
    .groupBy(submissions.inviteId)
    .as("sc");
  const revCount = db
    .select({ inviteId: reviews.inviteId, n: count().as("n") })
    .from(reviews)
    .groupBy(reviews.inviteId)
    .as("rc");

  const rows = await db
    .select({
      invite: invites,
      assessmentTitle: assessments.title,
      subs: sql<number>`coalesce(${subCount.n}, 0)`.mapWith(Number),
      revs: sql<number>`coalesce(${revCount.n}, 0)`.mapWith(Number),
    })
    .from(invites)
    .innerJoin(assessments, eq(assessments.id, invites.assessmentId))
    .leftJoin(subCount, eq(subCount.inviteId, invites.id))
    .leftJoin(revCount, eq(revCount.inviteId, invites.id))
    .orderBy(desc(invites.createdAt));

  const active = await db.query.assessments.findMany({
    where: eq(assessments.archived, false),
    orderBy: asc(assessments.title),
    columns: { id: true, title: true },
  });

  const list = rows
    .map((r) => ({ ...r, status: inviteStatus(r.invite, r.revs) }))
    .filter((r) => filter === "all" || r.status === filter);

  return (
    <>
      <PageHeader crumbs={[{ label: "Candidates" }]}>
        <NewInviteDialog assessments={active} />
      </PageHeader>
      <div className="flex items-center gap-1 border-b px-6 py-2">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={f === "all" ? "/admin/candidates" : `/admin/candidates?status=${f}`}
            className={cn(
              "rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground",
              filter === f && "bg-muted font-medium text-foreground",
            )}
          >
            {f === "all" ? "All" : STATUS_LABEL[f]}
          </Link>
        ))}
      </div>
      {list.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">
          {rows.length === 0 ? "No candidates yet. Create an invite to get started." : "Nothing matches this filter."}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Candidate</TableHead>
              <TableHead>Assessment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Reviews</TableHead>
              <TableHead className="pr-6 text-right">Invited</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.map(({ invite, assessmentTitle, subs, revs, status }) => {
              const total = invite.snapshot ? totalStages(invite) : null;
              const end = invite.finishedAt ?? new Date();
              return (
                <TableRow key={invite.id} className="cursor-pointer">
                  <TableCell className="pl-6">
                    <Link href={`/admin/candidates/${invite.id}`} className="block font-medium hover:underline">
                      {invite.candidateName}
                    </Link>
                    <div className="text-xs text-muted-foreground">{invite.email}</div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{assessmentTitle}</TableCell>
                  <TableCell>
                    <StatusBadge status={status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{total ? `${subs} / ${total}` : "–"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {invite.startedAt ? formatDuration(end.getTime() - invite.startedAt.getTime()) : "–"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{revs || "–"}</TableCell>
                  <TableCell className="pr-6 text-right text-muted-foreground">
                    {invite.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
