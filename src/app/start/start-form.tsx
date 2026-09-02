"use client";

import { useActionState } from "react";
import { startWithCode } from "@/actions/candidate";
import { SubmitButton } from "@/components/bits";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StartForm({ initialCode }: { initialCode: string }) {
  const [state, action] = useActionState(startWithCode, undefined);
  return (
    <form action={action} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="code">Invite code</Label>
        <Input
          id="code"
          name="code"
          defaultValue={initialCode}
          autoFocus
          autoComplete="off"
          spellCheck={false}
          placeholder="XXXXXXXX"
          className="h-11 font-mono text-lg uppercase tracking-[0.3em]"
          maxLength={8}
        />
        {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      </div>
      <SubmitButton className="w-full" size="lg">
        Begin
      </SubmitButton>
    </form>
  );
}
