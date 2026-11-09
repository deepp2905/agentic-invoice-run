import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { IconArrowLeft as ArrowLeft, IconCheck as Check, IconLoader2 as LoaderCircle, IconPlayerPause as Pause, IconPencil as Pencil, IconPlayerPlay as Play } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { InvestigationPanels, type InvestigationPanel } from "@/components/InvestigationPanels";
import { InvestigationCanvas } from "@/components/InvestigationCanvas";
import { advanceReplay, completionAgents, savedRuleView, startSavedReplay, type ReplayFlow } from "@/lib/replay-flow";
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
  const { state, dispatch, getCurrentState } = usePrototype();
  const [selected, setSelected] = useState<InvestigationPanel>(null);
  const [replay, setReplay] = useState<ReplayFlow | null>(null);
  const running = replay !== null && replay.phase !== "complete";
  const displayedReplay = running ? replay : savedRuleView(replay, state.rule);
  const caught = displayedReplay?.rule === "combined";
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    document.body.classList.add("run-toasts");
    const update = () => document.body.style.setProperty("--run-toast-bottom", `${element.getBoundingClientRect().height + 16}px`);
    const observer = new ResizeObserver(update);
    observer.observe(element); update();
    return () => { observer.disconnect(); document.body.classList.remove("run-toasts"); document.body.style.removeProperty("--run-toast-bottom"); };
  }, []);
  useEffect(() => {
    if (!replay || replay.phase === "complete") return;
    const timer = setTimeout(() => {
      const next = advanceReplay(replay);
      if (replay.phase === "running") {
        const name = agents[replay.index]?.name ?? "Agent";
        const outcome = nodeOutcome(replay.index, next);
        if (outcome === "warning") toast.warning(`${name} needs review`, { description: next.rule === "combined" ? "62% confidence · Duplicate flagged" : "62% confidence · Handed off without a flag", duration: 2500 });
        else if (outcome === "failed") toast.success("Duplicate caught", { description: "Held at Check duplicates · Not paid", duration: 2500 });
        else for (const index of completionAgents(replay)) toast.success(`${agents[index]?.name ?? "Agent"} completed`, { duration: 2500 });
      }
      if (next.phase === "complete") {
        dispatch({ type: "replay", caught: next.rule === "combined", time: actionTime() });
        if (next.rule === "exact") toast.error("Run completed with a duplicate payment", { description: "$12,480 paid again · Duplicate was not caught", duration: 2500 });
      }
      setReplay(next);
    }, replay.phase === "running" ? 1100 : 550);
    return () => clearTimeout(timer);
  }, [replay, dispatch]);
  return <AppShell canvas>
    <header className="run-header flex shrink-0 flex-wrap items-center gap-4 border-b border-border bg-background px-6 py-3 max-sm:px-4" aria-label={`Run ${runId}`}>
      <Link to="/" aria-label="Back to Runs" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /></Link>
      <h1 className="text-xl font-semibold">$12,480 paid twice</h1>
      <p role="status" className={`min-w-0 flex-1 text-sm ${!running && caught ? "text-success" : "text-destructive"}`}>{running ? "Replay in progress" : caught ? "Duplicate caught · Held at Check duplicates" : "Paid again, duplicate was not caught"}</p>
        <Button disabled={running} onClick={() => { setSelected(null); toast.dismiss(); setReplay(startSavedReplay(getCurrentState())); }}>{running ? <LoaderCircle className="motion-safe:animate-spin" /> : <Play />}{running ? "Replaying…" : "Replay run"}</Button>
    </header>
    <InvestigationCanvas replay={displayedReplay} paused={state.paused} onInspect={setSelected} />
    <footer ref={footer} className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-6 py-4 max-sm:px-4">
      <div className="flex items-center gap-4"><h2 className="text-lg font-semibold">Decide</h2><p className="text-xs text-muted-foreground">{state.paused ? "2 similar invoices paused, 1 safe to release" : "2 similar invoices queued, 1 safe to release"}</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={running} onClick={() => { if (state.paused) setSelected("pause"); else { dispatch({ type: "pause", time: actionTime() }); toast.success("2 similar runs paused", { duration: 2500 }); } }}>{state.paused ? <Check /> : <Pause />}{state.paused ? "Paused, 2 runs held" : "Pause similar runs"}</Button><Button variant="secondary" disabled={running} onClick={() => setSelected("rule")}><Pencil />Edit rule</Button></div>
    </footer>
    <InvestigationPanels panel={selected} onClose={() => setSelected(null)} />
  </AppShell>;
}
