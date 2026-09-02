import { redirect } from "next/navigation";
import { getCandidateInviteId } from "@/lib/candidate-session";
import { StartForm } from "./start-form";

export const metadata = { title: "Start" };

export default async function StartPage({ searchParams }: PageProps<"/start">) {
  const { code } = await searchParams;
  if (await getCandidateInviteId()) redirect("/c");
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Dripos</div>
          <h1 className="text-2xl font-semibold tracking-tight">Engineering takehome</h1>
          <p className="text-sm text-muted-foreground">
            Enter the invite code you received. The timer starts the first time you sign in, so open this
            when you are ready to work.
          </p>
        </div>
        <StartForm initialCode={typeof code === "string" ? code : ""} />
      </div>
    </main>
  );
}
