import { asc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { setArchived } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { db } from "@/db";
import { assessments, stages } from "@/db/schema";
import { PageHeader } from "../../page-header";
import { AssessmentEditor } from "./editor";

export const dynamic = "force-dynamic";

export default async function AssessmentPage({ params }: PageProps<"/admin/assessments/[id]">) {
  const { id } = await params;
  const a = await db.query.assessments.findFirst({ where: eq(assessments.id, id) });
  if (!a) notFound();
  const s = await db.query.stages.findMany({ where: eq(stages.assessmentId, id), orderBy: asc(stages.position) });

  return (
    <>
      <PageHeader crumbs={[{ label: "Assessments", href: "/admin/assessments" }, { label: a.title }]}>
        <form action={setArchived.bind(null, a.id, !a.archived)}>
          <Button type="submit" variant="ghost" size="sm" className="text-muted-foreground">
            {a.archived ? "Unarchive" : "Archive"}
          </Button>
        </form>
      </PageHeader>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <AssessmentEditor assessment={a} stages={s.map((x) => ({ title: x.title, body: x.body }))} />
      </div>
    </>
  );
}
