"use client";

import { MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { deleteInvite, revokeInvite } from "@/actions/admin";
import { CopyButton } from "@/components/bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CopyInviteLink({ code }: { code: string }) {
  return <CopyButton value={`${typeof window === "undefined" ? "" : window.location.origin}/start?code=${code}`} label="Copy link" />;
}

export function InviteActions({ id, revoked, finished }: { id: string; revoked: boolean; finished: boolean }) {
  const [confirm, setConfirm] = useState<"revoke" | "delete" | null>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="icon-sm" aria-label="Actions" />}>
          <MoreHorizontalIcon />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {!revoked && !finished && <DropdownMenuItem onClick={() => setConfirm("revoke")}>Revoke access</DropdownMenuItem>}
          <DropdownMenuItem variant="destructive" onClick={() => setConfirm("delete")}>
            Delete candidate
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "delete" ? "Delete this candidate?" : "Revoke access?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirm === "delete"
                ? "Removes the invite, every submission, and every review. This cannot be undone."
                : "The code stops working immediately and the candidate loses access to the assessment."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={async () => {
                if (confirm === "delete") {
                  await deleteInvite(id);
                  return;
                }
                await revokeInvite(id);
                toast.success("Access revoked");
                setConfirm(null);
              }}
            >
              {confirm === "delete" ? "Delete" : "Revoke"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
