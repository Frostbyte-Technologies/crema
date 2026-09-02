"use client";

import { PlusIcon, XIcon } from "lucide-react";
import { useActionState, useRef, useState } from "react";
import { submitStage } from "@/actions/candidate";
import { selectClass, SubmitButton } from "@/components/bits";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LINK_TYPES } from "@/lib/links";
import { cn } from "@/lib/utils";

export function SubmitForm({ stagePosition, isLast }: { stagePosition: number; isLast: boolean }) {
  const [state, action] = useActionState(submitStage, undefined);
  const [links, setLinks] = useState([0]);
  const [nextId, setNextId] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} id="stage-form" action={action} className="space-y-5">
      <input type="hidden" name="stagePosition" value={stagePosition} />
      <div className="space-y-2">
        <Label>Links</Label>
        <div className="space-y-2">
          {links.map((id, i) => (
            <div key={id} className="flex gap-2">
              <select name="linkType" className={cn(selectClass, "w-44 shrink-0")} defaultValue={i === 0 ? "expo" : "url"}>
                {LINK_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Input name="linkUrl" type="url" placeholder="https://" required={i === 0} />
              {links.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove link"
                  onClick={() => setLinks(links.filter((x) => x !== id))}
                >
                  <XIcon />
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setLinks([...links, nextId]);
            setNextId(nextId + 1);
          }}
        >
          <PlusIcon /> Add link
        </Button>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes for the reviewer</Label>
        <Textarea
          id="notes"
          name="notes"
          rows={6}
          placeholder="What you built, what you skipped and why, anything we should know before opening it."
        />
        <p className="text-xs text-muted-foreground">Markdown supported.</p>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="button" onClick={() => formRef.current?.reportValidity() && setConfirming(true)}>
        {isLast ? "Submit final work" : "Submit and reveal next task"}
      </Button>
      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit this stage?</AlertDialogTitle>
            <AlertDialogDescription>
              {isLast
                ? "This is your final submission. You will not be able to change it afterwards."
                : "Submissions are final. The next task will be revealed immediately and the clock keeps running."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep working</AlertDialogCancel>
            <SubmitButton form="stage-form">{isLast ? "Submit" : "Submit and continue"}</SubmitButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
