import type { LinkType } from "@/db/schema";

export const LINK_TYPES: { value: LinkType; label: string }[] = [
  { value: "expo", label: "Expo link" },
  { value: "url", label: "Deployment URL" },
  { value: "repo", label: "Repository" },
  { value: "video", label: "Video walkthrough" },
];

export const LINK_LABEL = Object.fromEntries(LINK_TYPES.map((t) => [t.value, t.label])) as Record<LinkType, string>;
