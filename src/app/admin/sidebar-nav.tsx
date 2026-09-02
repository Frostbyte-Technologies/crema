"use client";

import { FileTextIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const items = [
  { href: "/admin/candidates", label: "Candidates", icon: UsersIcon },
  { href: "/admin/assessments", label: "Assessments", icon: FileTextIcon },
];

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="space-y-0.5 px-2 py-2">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(
            "flex h-8 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            pathname.startsWith(href) && "bg-sidebar-accent font-medium text-foreground",
          )}
        >
          <Icon className="size-4" />
          {label}
        </Link>
      ))}
    </nav>
  );
}
