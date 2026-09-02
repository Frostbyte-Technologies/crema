import { ChevronRightIcon } from "lucide-react";
import Link from "next/link";
import { Fragment } from "react";

export function PageHeader({
  crumbs,
  children,
}: {
  crumbs: { label: string; href?: string }[];
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-1.5 text-sm">
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <ChevronRightIcon className="size-3.5 text-muted-foreground" />}
            {c.href ? (
              <Link href={c.href} className="text-muted-foreground hover:text-foreground">
                {c.label}
              </Link>
            ) : (
              <span className="font-medium">{c.label}</span>
            )}
          </Fragment>
        ))}
      </div>
      <div className="flex items-center gap-2">{children}</div>
    </header>
  );
}
