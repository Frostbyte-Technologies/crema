"use client";

import { PlusIcon } from "lucide-react";
import { useActionState } from "react";
import { createInvite } from "@/actions/admin";
import { selectClass, SubmitButton } from "@/components/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NewInviteDialog({ assessments }: { assessments: { id: string; title: string }[] }) {
  const [state, action] = useActionState(createInvite, undefined);
  return (
    <Dialog>
      <DialogTrigger render={<Button size="sm" />}>
        <PlusIcon /> New invite
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={action} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Invite a candidate</DialogTitle>
            <DialogDescription>Generates a one-time code. The clock starts when they first sign in.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="candidateName">Name</Label>
            <Input id="candidateName" name="candidateName" required autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assessmentId">Assessment</Label>
            <select id="assessmentId" name="assessmentId" className={selectClass} required defaultValue="">
              <option value="" disabled>
                Choose…
              </option>
              {assessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </div>
          {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
          <DialogFooter>
            <SubmitButton>Create invite</SubmitButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
