import type { Invite, Submission } from "@/db/schema";

export type InviteStatus = "invited" | "in_progress" | "submitted" | "reviewed" | "revoked";

export function inviteStatus(invite: Invite, reviewCount = 0): InviteStatus {
  if (invite.revokedAt) return "revoked";
  if (invite.finishedAt) return reviewCount > 0 ? "reviewed" : "submitted";
  if (invite.startedAt) return "in_progress";
  return "invited";
}

export const STATUS_LABEL: Record<InviteStatus, string> = {
  invited: "Invited",
  in_progress: "In progress",
  submitted: "Submitted",
  reviewed: "Reviewed",
  revoked: "Revoked",
};

/** Total number of deliverables: the initial prompt plus every follow-up stage. */
export function totalStages(invite: Invite) {
  return (invite.snapshot?.stages.length ?? 0) + 1;
}

export function formatDuration(ms: number) {
  const total = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(total / 60);
  const m = total % 60;
  if (h === 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export function deadline(invite: Invite): Date | null {
  const limit = invite.snapshot?.timeLimitMinutes;
  if (!invite.startedAt || !limit) return null;
  return new Date(invite.startedAt.getTime() + limit * 60000);
}

/** Milliseconds a submission landed past the soft deadline, or 0. */
export function lateBy(invite: Invite, at: Date | null) {
  const due = deadline(invite);
  if (!due || !at) return 0;
  return Math.max(0, at.getTime() - due.getTime());
}

/** Wall time spent on each stage, keyed by stage position. */
export function stageDurations(invite: Invite, subs: Submission[]) {
  const out: Record<number, number> = {};
  if (!invite.startedAt) return out;
  let prev = invite.startedAt.getTime();
  for (const s of [...subs].sort((a, b) => a.stagePosition - b.stagePosition)) {
    out[s.stagePosition] = s.submittedAt.getTime() - prev;
    prev = s.submittedAt.getTime();
  }
  return out;
}
