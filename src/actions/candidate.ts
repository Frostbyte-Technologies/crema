"use server";

import { and, asc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { assessments, invites, stages, submissions, type Link } from "@/db/schema";
import { getCandidateInviteId, setCandidateSession } from "@/lib/candidate-session";
import { totalStages } from "@/lib/invite";

export type ActionState = { error?: string } | undefined;

export async function startWithCode(_: ActionState, formData: FormData): Promise<ActionState> {
  const code = String(formData.get("code") ?? "")
    .trim()
    .toUpperCase();
  if (code.length < 6) return { error: "Enter the code from your invite." };

  const invite = await db.query.invites.findFirst({ where: eq(invites.code, code) });
  if (!invite || invite.revokedAt) return { error: "That code is not valid." };
  if (invite.finishedAt) return { error: "This assessment has already been submitted." };

  if (!invite.startedAt) {
    const a = await db.query.assessments.findFirst({ where: eq(assessments.id, invite.assessmentId) });
    if (!a) return { error: "Assessment is missing. Contact your interviewer." };
    const s = await db.query.stages.findMany({
      where: eq(stages.assessmentId, a.id),
      orderBy: asc(stages.position),
    });
    await db
      .update(invites)
      .set({
        startedAt: new Date(),
        snapshot: {
          title: a.title,
          prompt: a.prompt,
          starterUrl: a.starterUrl,
          starterRepoUrl: a.starterRepoUrl,
          timeLimitMinutes: a.timeLimitMinutes,
          stages: s.map((x, i) => ({ position: i + 1, title: x.title, body: x.body })),
        },
      })
      .where(and(eq(invites.id, invite.id), eq(invites.code, code)));
  }

  await setCandidateSession(invite.id);
  redirect("/c");
}

const linkSchema = z.object({
  type: z.enum(["expo", "url", "repo", "video"]),
  url: z.url().trim(),
});

export async function submitStage(_: ActionState, formData: FormData): Promise<ActionState> {
  const inviteId = await getCandidateInviteId();
  if (!inviteId) redirect("/start");

  const invite = await db.query.invites.findFirst({ where: eq(invites.id, inviteId) });
  if (!invite || invite.revokedAt || invite.finishedAt || !invite.startedAt) redirect("/start");

  const stagePosition = Number(formData.get("stagePosition"));
  const notes = String(formData.get("notes") ?? "").trim();
  const types = formData.getAll("linkType").map(String);
  const urls = formData.getAll("linkUrl").map(String);
  const parsed = z
    .array(linkSchema)
    .min(1, "Add at least one link.")
    .safeParse(
      types
        .map((type, i) => ({ type, url: urls[i] ?? "" }))
        .filter((l) => l.url.trim().length > 0),
    );
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your links." };
  const links: Link[] = parsed.data;

  const existing = await db.query.submissions.findMany({ where: eq(submissions.inviteId, invite.id) });
  const expected = existing.length;
  if (stagePosition !== expected) return { error: "This stage was already submitted. Refresh the page." };

  await db.insert(submissions).values({ inviteId: invite.id, stagePosition, links, notes });

  if (expected + 1 >= totalStages(invite)) {
    await db.update(invites).set({ finishedAt: new Date() }).where(eq(invites.id, invite.id));
  }
  redirect("/c");
}
