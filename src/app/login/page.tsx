import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Sign in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if ((await auth())?.user?.email) redirect("/admin/candidates");
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-6 text-center">
        <div className="space-y-2">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Dripos</div>
          <h1 className="text-2xl font-semibold tracking-tight">Interviewer sign in</h1>
          <p className="text-sm text-muted-foreground">Use your Dripos Google account.</p>
        </div>
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/admin/candidates" });
          }}
        >
          <Button type="submit" size="lg" className="w-full">
            Continue with Google
          </Button>
        </form>
        {error && <p className="text-sm text-destructive">That account is not allowed here.</p>}
      </div>
    </main>
  );
}
