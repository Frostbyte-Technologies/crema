"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { saveReview } from "@/actions/admin";
import { SubmitButton } from "@/components/bits";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Decision } from "@/db/schema";
import { cn } from "@/lib/utils";

const DECISIONS: { value: Decision; label: string }[] = [
  { value: "strong_yes", label: "Strong yes" },
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "strong_no", label: "Strong no" },
];

export function ReviewForm({
  inviteId,
  stages,
  existing,
}: {
  inviteId: string;
  stages: { position: number; title: string }[];
  existing: { scores: Record<number, number>; notes: string; decision: Decision | null } | null;
}) {
  const [state, action] = useActionState(saveReview, undefined);
  useEffect(() => {
    if (state?.ok) toast.success("Review saved");
  }, [state]);

  return (
    <form action={action} className="space-y-5 rounded-lg border p-4">
      <input type="hidden" name="inviteId" value={inviteId} />
      {stages.length > 0 && (
        <div className="space-y-3">
          <Label>Scores</Label>
          {stages.map((s) => (
            <div key={s.position} className="flex items-center justify-between gap-3 text-sm">
              <span className="truncate text-muted-foreground">
                {s.position + 1}. {s.title}
              </span>
              <div className="flex shrink-0 gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <label key={n} className="cursor-pointer">
                    <input
                      type="radio"
                      name={`score-${s.position}`}
                      value={n}
                      defaultChecked={existing?.scores[s.position] === n}
                      className="peer sr-only"
                    />
                    <span className="flex size-7 items-center justify-center rounded-md border text-xs text-muted-foreground hover:bg-muted peer-checked:border-primary peer-checked:bg-primary peer-checked:text-primary-foreground peer-focus-visible:ring-2 peer-focus-visible:ring-ring">
                      {n}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="review-notes">Notes</Label>
        <Textarea
          id="review-notes"
          name="notes"
          rows={6}
          defaultValue={existing?.notes ?? ""}
          placeholder="What stood out, what worried you, questions for the live round."
        />
      </div>
      <div className="space-y-2">
        <Label>Decision</Label>
        <div className="grid grid-cols-2 gap-1.5">
          {DECISIONS.map((d) => (
            <label key={d.value} className="cursor-pointer">
              <input
                type="radio"
                name="decision"
                value={d.value}
                defaultChecked={existing?.decision === d.value}
                className="peer sr-only"
              />
              <span
                className={cn(
                  "flex h-8 items-center justify-center rounded-md border text-xs font-medium text-muted-foreground hover:bg-muted peer-focus-visible:ring-2 peer-focus-visible:ring-ring",
                  d.value.endsWith("yes")
                    ? "peer-checked:border-emerald-600 peer-checked:bg-emerald-600 peer-checked:text-white"
                    : "peer-checked:border-rose-600 peer-checked:bg-rose-600 peer-checked:text-white",
                )}
              >
                {d.label}
              </span>
            </label>
          ))}
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <SubmitButton className="w-full" variant="outline">
        {existing ? "Update review" : "Save review"}
      </SubmitButton>
    </form>
  );
}
