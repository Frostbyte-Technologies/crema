"use server";

import { put } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { customAlphabet } from "nanoid";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/auth";
import { db } from "@/db";
import { assessments, invites, reviews, stages, type Decision } from "@/db/schema";

export type ActionState = { error?: string; ok?: boolean } | undefined;

// No 0/O/1/I so codes survive being read aloud.
const genCode = customAlphabet("ABCDEFGHJKLMNPQRSTUVWXYZ23456789", 8);

const optionalUrl = z
  .string()
  .trim()
  .transform((s) => (s.length === 0 ? null : s))
  .pipe(z.url().nullable());

const assessmentSchema = z.object({
  title: z.string().trim().min(1, "Title is required."),
  description: z.string().trim(),
  prompt: z.string(),
  starterRepoUrl: optionalUrl,
  timeLimitMinutes: z
    .string()
    .trim()
    .transform((s) => (s.length === 0 ? null : Number(s)))
    .pipe(z.number().int().positive().nullable()),
});

export async function createAssessment() {
  await requireAdmin();
  const [a] = await db.insert(assessments).values({ title: "Untitled assessment" }).returning();
  redirect(`/admin/assessments/${a.id}`);
}

export async function saveAssessment(_: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const parsed = assessmentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    prompt: formData.get("prompt"),
    starterRepoUrl: formData.get("starterRepoUrl"),
    timeLimitMinutes: formData.get("timeLimitMinutes"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const patch: Partial<typeof assessments.$inferInsert> = parsed.data;
  const starter = formData.get("starter");
  if (starter instanceof File && starter.size > 0) {
    if (!starter.name.endsWith(".zip")) return { error: "Starter code must be a .zip." };
    const blob = await put(`starters/${id}/${starter.name}`, starter, {
      access: "public",
      addRandomSuffix: true,
    });
    patch.starterUrl = blob.url;
  }
  if (formData.get("clearStarter") === "on") patch.starterUrl = null;

  // Stages arrive as parallel arrays in display order; position is the index.
  const titles = formData.getAll("stageTitle").map(String);
  const bodies = formData.getAll("stageBody").map(String);
  const rows = titles
    .map((title, i) => ({ title: title.trim(), body: (bodies[i] ?? "").trim() }))
    .filter((s) => s.title.length > 0 || s.body.length > 0)
    .map((s, i) => ({ ...s, assessmentId: id, position: i + 1 }));

  await db.update(assessments).set(patch).where(eq(assessments.id, id));
  await db.delete(stages).where(eq(stages.assessmentId, id));
  if (rows.length > 0) await db.insert(stages).values(rows);

  revalidatePath(`/admin/assessments/${id}`);
  revalidatePath("/admin/assessments");
  return { ok: true };
}

export async function setArchived(id: string, archived: boolean) {
  await requireAdmin();
  await db.update(assessments).set({ archived }).where(eq(assessments.id, id));
  revalidatePath("/admin/assessments");
}

const inviteSchema = z.object({
  candidateName: z.string().trim().min(1, "Name is required."),
  email: z.string().trim(),
  assessmentId: z.string().min(1, "Pick an assessment."),
});

export async function createInvite(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const parsed = inviteSchema.safeParse({
    candidateName: formData.get("candidateName"),
    email: formData.get("email"),
    assessmentId: formData.get("assessmentId"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message };

  const [row] = await db
    .insert(invites)
    .values({ ...parsed.data, code: genCode(), createdBy: admin.email })
    .returning();
  redirect(`/admin/candidates/${row.id}`);
}

export async function revokeInvite(id: string) {
  await requireAdmin();
  await db.update(invites).set({ revokedAt: new Date() }).where(eq(invites.id, id));
  revalidatePath(`/admin/candidates/${id}`);
  revalidatePath("/admin/candidates");
}

export async function deleteInvite(id: string) {
  await requireAdmin();
  await db.delete(invites).where(eq(invites.id, id));
  redirect("/admin/candidates");
}

const decisions = ["strong_yes", "yes", "no", "strong_no"] as const;

export async function saveReview(_: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin();
  const inviteId = String(formData.get("inviteId"));
  const notes = String(formData.get("notes") ?? "").trim();
  const rawDecision = String(formData.get("decision") ?? "");
  const decision = (decisions as readonly string[]).includes(rawDecision) ? (rawDecision as Decision) : null;

  const scores: Record<number, number> = {};
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("score-")) continue;
    const n = Number(value);
    if (n >= 1 && n <= 5) scores[Number(key.slice(6))] = n;
  }

  await db
    .insert(reviews)
    .values({ inviteId, reviewerEmail: admin.email, reviewerName: admin.name, scores, notes, decision })
    .onConflictDoUpdate({
      target: [reviews.inviteId, reviews.reviewerEmail],
      set: { scores, notes, decision, reviewerName: admin.name, updatedAt: new Date() },
    });

  revalidatePath(`/admin/candidates/${inviteId}`);
  revalidatePath("/admin/candidates");
  return { ok: true };
}
