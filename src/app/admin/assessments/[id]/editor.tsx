"use client";

import { ArrowDownIcon, ArrowUpIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useActionState, useEffect, useState } from "react";
import { toast } from "sonner";
import { saveAssessment } from "@/actions/admin";
import { SubmitButton } from "@/components/bits";
import { Markdown } from "@/components/markdown";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { Assessment } from "@/db/schema";

type StageDraft = { key: number; title: string; body: string };

export function AssessmentEditor({ assessment, stages }: { assessment: Assessment; stages: { title: string; body: string }[] }) {
  const [state, action] = useActionState(saveAssessment, undefined);
  const [drafts, setDrafts] = useState<StageDraft[]>(stages.map((s, i) => ({ key: i, ...s })));
  const [nextKey, setNextKey] = useState(stages.length);

  useEffect(() => {
    if (state?.ok) toast.success("Saved");
  }, [state]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= drafts.length) return;
    const next = [...drafts];
    [next[i], next[j]] = [next[j], next[i]];
    setDrafts(next);
  };

  return (
    <form action={action} className="space-y-10">
      <input type="hidden" name="id" value={assessment.id} />

      <section className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" defaultValue={assessment.title} required className="text-base font-medium" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Internal description</Label>
          <Input id="description" name="description" defaultValue={assessment.description} placeholder="Only interviewers see this." />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="timeLimitMinutes">Soft time limit (minutes)</Label>
            <Input
              id="timeLimitMinutes"
              name="timeLimitMinutes"
              type="number"
              min={1}
              defaultValue={assessment.timeLimitMinutes ?? ""}
              placeholder="Leave empty for none"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="starterRepoUrl">Template repo URL</Label>
            <Input id="starterRepoUrl" name="starterRepoUrl" type="url" defaultValue={assessment.starterRepoUrl ?? ""} placeholder="https://github.com/…" />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="starter">Starter code (.zip)</Label>
          <Input id="starter" name="starter" type="file" accept=".zip" />
          {assessment.starterUrl && (
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <a href={assessment.starterUrl} className="truncate text-primary hover:underline">
                Current: {assessment.starterUrl.split("/").pop()}
              </a>
              <label className="flex items-center gap-1.5">
                <input type="checkbox" name="clearStarter" className="size-3.5" /> Remove
              </label>
            </div>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <Label htmlFor="prompt">Initial prompt</Label>
        <p className="text-xs text-muted-foreground">
          What the candidate sees first. Markdown. Follow-up tasks below unlock one at a time after each submission.
        </p>
        <MarkdownField id="prompt" name="prompt" defaultValue={assessment.prompt} rows={18} />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Follow-up tasks</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDrafts([...drafts, { key: nextKey, title: "", body: "" }]);
              setNextKey(nextKey + 1);
            }}
          >
            <PlusIcon /> Add task
          </Button>
        </div>
        {drafts.length === 0 && (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            No follow-ups. The candidate finishes after the initial prompt.
          </p>
        )}
        {drafts.map((d, i) => (
          <div key={d.key} className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2">
              <span className="w-6 text-sm text-muted-foreground">{i + 1}.</span>
              <Input
                name="stageTitle"
                value={d.title}
                onChange={(e) => setDrafts(drafts.map((x) => (x.key === d.key ? { ...x, title: e.target.value } : x)))}
                placeholder="Task title, e.g. Add offline support"
                className="font-medium"
              />
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUpIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Move down"
                disabled={i === drafts.length - 1}
                onClick={() => move(i, 1)}
              >
                <ArrowDownIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="Remove"
                onClick={() => setDrafts(drafts.filter((x) => x.key !== d.key))}
              >
                <Trash2Icon />
              </Button>
            </div>
            <MarkdownField
              name="stageBody"
              value={d.body}
              onChange={(v) => setDrafts(drafts.map((x) => (x.key === d.key ? { ...x, body: v } : x)))}
              rows={8}
            />
          </div>
        ))}
      </section>

      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <div className="sticky bottom-0 -mx-6 flex justify-end border-t bg-background/80 px-6 py-3 backdrop-blur">
        <SubmitButton>Save</SubmitButton>
      </div>
    </form>
  );
}

function MarkdownField(props: {
  id?: string;
  name: string;
  rows: number;
  defaultValue?: string;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [text, setText] = useState(props.defaultValue ?? "");
  const current = props.value ?? text;
  return (
    <Tabs defaultValue="write">
      <TabsList>
        <TabsTrigger value="write">Write</TabsTrigger>
        <TabsTrigger value="preview">Preview</TabsTrigger>
      </TabsList>
      <TabsContent value="write">
        <Textarea
          id={props.id}
          name={props.name}
          rows={props.rows}
          value={current}
          onChange={(e) => (props.onChange ? props.onChange(e.target.value) : setText(e.target.value))}
          className="font-mono text-[13px] leading-relaxed"
        />
      </TabsContent>
      <TabsContent value="preview">
        {/* Keep the field in the form while previewing. */}
        <input type="hidden" name={props.name} value={current} />
        <div className="min-h-24 rounded-lg border p-4">
          {current.trim() ? <Markdown>{current}</Markdown> : <p className="text-sm text-muted-foreground">Nothing to preview.</p>}
        </div>
      </TabsContent>
    </Tabs>
  );
}
