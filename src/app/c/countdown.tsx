"use client";

import { ClockIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/invite";
import { cn } from "@/lib/utils";

export function Countdown({ startedAt, deadline }: { startedAt: string; deadline: string | null }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (!deadline) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <ClockIcon className="size-3.5" />
        {formatDuration(now - new Date(startedAt).getTime())} elapsed
      </span>
    );
  }
  const remaining = new Date(deadline).getTime() - now;
  const late = remaining < 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs",
        late ? "text-destructive" : remaining < 30 * 60000 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      )}
    >
      <ClockIcon className="size-3.5" />
      {late ? `${formatDuration(-remaining)} over` : `${formatDuration(remaining)} left`}
    </span>
  );
}
