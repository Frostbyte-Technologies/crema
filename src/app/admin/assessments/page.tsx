import { asc, count, eq, sql } from "drizzle-orm";
import { PlusIcon } from "lucide-react";
import Link from "next/link";
import { createAssessment } from "@/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { db } from "@/db";
import { assessments, invites, stages } from "@/db/schema";
import { PageHeader } from "../page-header";

export const metadata = { title: "Assessments" };
export const dynamic = "force-dynamic";

export default async function AssessmentsPage() {
  const stageCount = db
    .select({ assessmentId: stages.assessmentId, stages: count().as("stages") })
    .from(stages)
    .groupBy(stages.assessmentId)
    .as("st");
  const inviteCount = db
    .select({ assessmentId: invites.assessmentId, invites: count().as("invites") })
    .from(invites)
    .groupBy(invites.assessmentId)
    .as("iv");
  const rows = await db
    .select({
      a: assessments,
      stages: sql<number>`coalesce(${stageCount.stages}, 0)`.mapWith(Number),
      invites: sql<number>`coalesce(${inviteCount.invites}, 0)`.mapWith(Number),
    })
    .from(assessments)
    .leftJoin(stageCount, eq(stageCount.assessmentId, assessments.id))
    .leftJoin(inviteCount, eq(inviteCount.assessmentId, assessments.id))
    .orderBy(asc(assessments.archived), asc(assessments.title));

  return (
    <>
      <PageHeader crumbs={[{ label: "Assessments" }]}>
        <form action={createAssessment}>
          <Button size="sm">
            <PlusIcon /> New assessment
          </Button>
        </form>
      </PageHeader>
      {rows.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted-foreground">No assessments yet.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-6">Title</TableHead>
              <TableHead>Follow-up tasks</TableHead>
              <TableHead>Time limit</TableHead>
              <TableHead>Candidates</TableHead>
              <TableHead className="pr-6" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map(({ a, stages: n, invites: inv }) => (
              <TableRow key={a.id}>
                <TableCell className="pl-6">
                  <Link href={`/admin/assessments/${a.id}`} className="font-medium hover:underline">
                    {a.title}
                  </Link>
                  {a.description && <div className="text-xs text-muted-foreground">{a.description}</div>}
                </TableCell>
                <TableCell className="text-muted-foreground">{n}</TableCell>
                <TableCell className="text-muted-foreground">{a.timeLimitMinutes ? `${a.timeLimitMinutes} min` : "None"}</TableCell>
                <TableCell className="text-muted-foreground">{inv}</TableCell>
                <TableCell className="pr-6 text-right">{a.archived && <Badge variant="outline">Archived</Badge>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
