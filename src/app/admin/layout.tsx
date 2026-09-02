import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { ThemeToggle } from "@/components/bits";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "./sidebar-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const { name, email, image } = session.user;

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r bg-sidebar">
        <div className="flex h-12 items-center gap-2 px-4">
          <span className="flex size-5 items-center justify-center rounded bg-primary text-[10px] font-bold text-primary-foreground">
            C
          </span>
          <span className="text-sm font-semibold tracking-tight">Crema</span>
        </div>
        <SidebarNav />
        <div className="mt-auto flex items-center gap-2 border-t p-3">
          <Avatar className="size-6">
            <AvatarImage src={image ?? undefined} />
            <AvatarFallback className="text-[10px]">{(name ?? email ?? "?").slice(0, 1).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{name ?? email}</div>
          <ThemeToggle />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              Out
            </Button>
          </form>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
