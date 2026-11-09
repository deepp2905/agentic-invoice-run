import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Pause, Pencil, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { InvestigationPanels, type InvestigationPanel } from "@/components/InvestigationPanels";
import { InvestigationCanvas } from "@/components/InvestigationCanvas";
import { advanceReplay, startReplay, type ReplayFlow } from "@/lib/replay-flow";
import { nodeOutcome } from "@/lib/replay-flow";
import { agents } from "@/lib/mock-data";
import { toast } from "sonner";

export const Route = createFileRoute("/runs/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.runId} — Ledger Watch` },
      { name: "description", content: "Agent inspection line for an invoice payment run." },
      { property: "og:title", content: `Run ${params.runId} — Ledger Watch` },
      { property: "og:description", content: "Agent inspection line for an invoice payment run." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunView,
});

function RunView() {
  const { runId } = Route.useParams();
  const { state, dispatch } = usePrototype();
  const [selected, setSelected] = useState<InvestigationPanel>(null);
  const [replay, setReplay] = useState<ReplayFlow | null>(null);
  const running = replay !== null && replay.phase !== "complete";
  const caught = replay?.rule === "combined";
  useEffect(() => {
    if (!replay || replay.phase === "complete") return;
    const timer = setTimeout(() => {
      const next = advanceReplay(replay);
      if (replay.phase === "running") {
        const name = agents[replay.index]?.name ?? "Agent";
        const outcome = nodeOutcome(replay.index, next);
        if (outcome === "warning") toast.warning(`${name} needs review`, { description: "62% confidence · Handed off without a flag", duration: 3500 });
        else if (outcome === "failed") toast.error(`${name} held payment`, { description: "Duplicate caught · Payment skipped", duration: 4500 });
        else toast.success(`${name} completed`, { duration: 2500 });
      }
      if (next.phase === "complete") {
        dispatch({ type: "replay", caught: next.rule === "combined", time: actionTime() });
        if (next.rule === "exact") toast.error("Run completed with a duplicate payment", { description: "$12,480 paid again · Duplicate was not caught", duration: 5000 });
      }
      setReplay(next);
    }, replay.phase === "running" ? 1100 : 550);
    return () => clearTimeout(timer);
  }, [replay, dispatch]);
  return <AppShell canvas>
    <header className="shrink-0 border-b border-border bg-background px-6 py-5 max-sm:px-4">
      <Link to="/" className="mb-3 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3.5 w-3.5" />Runs</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="font-serif text-3xl font-semibold uppercase sm:text-4xl">$12,480 paid twice</h1><p className="mt-2 text-xs text-muted-foreground"><span className="font-mono">{runId}</span> · Nov 7, 09:14 · Harbor Office Supply</p></div>
        <Button variant="outline" className="shadow-none" disabled={running} onClick={() => { setSelected(null); setReplay(startReplay(state.rule)); }}>{running ? <LoaderCircle className="motion-safe:animate-spin" /> : <Play />}{running ? "Replaying…" : "Replay run"}</Button>
      </div>
      {replay?.phase === "complete" && <div role="status" className={`mt-3 text-sm font-semibold ${caught ? "text-primary" : "text-destructive"}`}>{caught ? "Duplicate caught · Held at Policy · Payment skipped" : "Paid again · Duplicate was not caught"}</div>}
    </header>
    <InvestigationCanvas replay={replay} paused={state.paused} onInspect={setSelected} />
    <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-6 py-4 max-sm:px-4">
      <div className="flex items-center gap-4"><h2 className="text-lg font-semibold">Decide</h2><p className="text-xs text-muted-foreground">{state.paused ? "3 similar invoices are paused." : "3 similar invoices are queued."}</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" className="shadow-none" disabled={running} onClick={() => setSelected("pause")}><Pause />{state.paused ? "View paused runs" : "Pause similar runs"}</Button><Button variant="outline" className="shadow-none" disabled={running} onClick={() => setSelected("rule")}><Pencil />Edit rule</Button></div>
    </footer>
    <InvestigationPanels panel={selected} onClose={() => setSelected(null)} />
  </AppShell>;
}
