import { createFileRoute } from "@tanstack/react-router";
import { IconArrowBackUp as Undo2, IconHistory as History } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { Button } from "@/components/ui/button";

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
function ActivityPage() {
  const { state, dispatch } = usePrototype();
  return <AppShell>
    <h1 className="mb-6 text-2xl font-semibold">Activity</h1>
    {state.log.length === 0 ? <div className="flex items-center gap-3 border-y border-border py-8 text-muted-foreground"><History className="h-5 w-5" />No activity yet.</div> :
      <ol className="divide-y divide-border border-y border-border">{state.log.map((entry) => {
        const undoable = (entry.kind === "pause" || entry.kind === "rule") && !entry.undone && state.log.find((item) => item.kind === entry.kind && !item.undone)?.id === entry.id;
        return <li key={entry.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
          <div><p className="font-medium">{entry.message}</p><p className="mt-1 text-sm text-muted-foreground"><time>{entry.time}</time> · Finance lead{entry.undone ? " · Undone" : ""}</p></div>
          {undoable && <Button variant="outline" size="sm" aria-label={`Undo: ${entry.message}`} onClick={() => dispatch({ type: "undo", id: entry.id, time: actionTime() })}><Undo2 />Undo</Button>}
        </li>;
      })}</ol>}
  </AppShell>;
}