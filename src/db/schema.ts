import { boolean, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { nanoid } from "nanoid";

const id = () => text("id").primaryKey().$defaultFn(() => nanoid(12));
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export type StageDef = { position: number; title: string; body: string };

/** Frozen copy of an assessment taken when the candidate first signs in. */
export type Snapshot = {
  title: string;
  prompt: string;
  starterUrl: string | null;
  starterRepoUrl: string | null;
  timeLimitMinutes: number | null;
  stages: StageDef[];
};

export type LinkType = "expo" | "url" | "repo" | "video";
export type Link = { type: LinkType; url: string };

export type Decision = "strong_yes" | "yes" | "no" | "strong_no";

export const assessments = pgTable("assessments", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  prompt: text("prompt").notNull().default(""),
  starterUrl: text("starter_url"),
  starterRepoUrl: text("starter_repo_url"),
  timeLimitMinutes: integer("time_limit_minutes"),
  archived: boolean("archived").notNull().default(false),
  createdAt: createdAt(),
});

export const stages = pgTable("stages", {
  id: id(),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id, { onDelete: "cascade" }),
  position: integer("position").notNull(),
  title: text("title").notNull().default(""),
  body: text("body").notNull().default(""),
});

export const invites = pgTable("invites", {
  id: id(),
  code: text("code").notNull().unique(),
  candidateName: text("candidate_name").notNull(),
  email: text("email").notNull().default(""),
  assessmentId: text("assessment_id")
    .notNull()
    .references(() => assessments.id),
  snapshot: jsonb("snapshot").$type<Snapshot>(),
  startedAt: timestamp("started_at", { withTimezone: true }),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
  createdBy: text("created_by").notNull().default(""),
  createdAt: createdAt(),
});

export const submissions = pgTable("submissions", {
  id: id(),
  inviteId: text("invite_id")
    .notNull()
    .references(() => invites.id, { onDelete: "cascade" }),
  stagePosition: integer("stage_position").notNull(),
  links: jsonb("links").$type<Link[]>().notNull().default([]),
  notes: text("notes").notNull().default(""),
  submittedAt: createdAt(),
});

export const reviews = pgTable(
  "reviews",
  {
    id: id(),
    inviteId: text("invite_id")
      .notNull()
      .references(() => invites.id, { onDelete: "cascade" }),
    reviewerEmail: text("reviewer_email").notNull(),
    reviewerName: text("reviewer_name").notNull().default(""),
    scores: jsonb("scores").$type<Record<number, number>>().notNull().default({}),
    notes: text("notes").notNull().default(""),
    decision: text("decision").$type<Decision>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("reviews_invite_reviewer").on(t.inviteId, t.reviewerEmail)],
);

export type Assessment = typeof assessments.$inferSelect;
export type Stage = typeof stages.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type Submission = typeof submissions.$inferSelect;
export type Review = typeof reviews.$inferSelect;
