import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageTitle } from "@/components/system";
import { IconArrowBackUp as Undo2, IconHistory as History, IconPencil as Pencil, IconPlayerPause as Pause, IconPlayerPlay as Play, IconToggleRight as Toggle } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { Button } from "@/components/ui/button";
import { isUndoable, type ActionKind, type LogCategory } from "@/lib/prototype-state";

export const Route = createFileRoute("/activity")({
  head: () => ({ meta: [
    { title: "Activity — Ledger Watch" },
    { name: "description", content: "Finance investigation actions, rule changes and replay results." },
    { property: "og:title", content: "Activity — Ledger Watch" },
    { property: "og:description", content: "Finance investigation actions, rule changes and replay results." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ActivityPage,
});

const kindIcon: Record<ActionKind, typeof Play> = { pause: Pause, rule: Pencil, toggle: Toggle, replay: Play, undo: Undo2 };
const filters: { id: "all" | LogCategory; label: string }[] = [
  { id: "all", label: "All" },
  { id: "rules", label: "Rules" },
  { id: "runs", label: "Runs" },
];

function ActivityPage() {
  const { state, dispatch } = usePrototype();
  const [filter, setFilter] = useState<"all" | LogCategory>("all");
  const entries = state.log.filter((entry) => filter === "all" || entry.category === filter);
  return <AppShell>
    <PageTitle>Activity</PageTitle>
    <div className="mb-6 flex gap-2" role="tablist" aria-label="Filter activity">
      {filters.map((item) => (
        <button key={item.id} role="tab" aria-selected={filter === item.id} onClick={() => setFilter(item.id)}
          className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${filter === item.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
          {item.label}
        </button>
      ))}
    </div>
    {entries.length === 0 ? <div className="flex items-center gap-3 border-y border-border py-8 text-muted-foreground"><History className="h-5 w-5" />No changes yet.</div> :
      <ol className="divide-y divide-border border-y border-border">{entries.map((entry) => {
        const Icon = kindIcon[entry.kind];
        const undoable = isUndoable(entry) && !entry.undone && state.log.find((item) => item.kind === entry.kind && !item.undone && (entry.kind !== "toggle" || item.ruleId === entry.ruleId))?.id === entry.id;
        return <li key={entry.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div className="flex items-start gap-3">
            <Icon className="mt-1 size-4 shrink-0 text-muted-foreground" />
            <div><p className={`font-medium ${entry.undone ? "text-muted-foreground line-through" : ""}`}>{entry.message}</p>{entry.affects && <p className="mt-1 text-sm text-foreground/80">{entry.affects}</p>}<p className="mt-1 text-sm text-muted-foreground"><time>{entry.time}</time> · You</p></div>
          </div>
          {entry.undone ? <span className="text-sm text-muted-foreground">Undone</span> : undoable && <Button variant="secondary" size="sm" aria-label={`Undo: ${entry.message}`} onClick={() => dispatch({ type: "undo", id: entry.id, time: actionTime() })}><Undo2 />Undo</Button>}
        </li>;
      })}</ol>}
  </AppShell>;
}
