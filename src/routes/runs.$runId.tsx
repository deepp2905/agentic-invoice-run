import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { IconArrowLeft as ArrowLeft, IconCheck as Check, IconLoader2 as LoaderCircle, IconPlayerPause as Pause, IconPencil as Pencil, IconPlayerPlay as Play } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { InvestigationPanels, type InvestigationPanel } from "@/components/InvestigationPanels";
import { InvestigationCanvas } from "@/components/InvestigationCanvas";
import { advanceReplay, completionAgents, savedRuleView, startSavedReplay, type ReplayFlow } from "@/lib/replay-flow";
import { nodeOutcome } from "@/lib/replay-flow";
import { getRunDetail, type RunDetail } from "@/lib/mock-runs";
import { toast } from "sonner";

export const Route = createFileRoute("/runs/$runId")({
  loader: ({ params }) => {
    const run = getRunDetail(params.runId);
    if (!run) throw notFound();
    return run;
  },
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
  const run = Route.useLoaderData();
  return <RunDetailView key={run.id} run={run} />;
}

function RunDetailView({ run }: { run: RunDetail }) {
  const runId = run.id;
  const { state, dispatch, getCurrentState } = usePrototype();
  const [selected, setSelected] = useState<InvestigationPanel>(null);
  const [replay, setReplay] = useState<ReplayFlow | null>(null);
  const running = replay !== null && replay.phase !== "complete";
  const displayedReplay = running || !run.duplicate ? replay : savedRuleView(replay, state.rule);
  const caught = run.duplicate && displayedReplay?.rule === "combined";
  const footer = useRef<HTMLElement>(null);
  useEffect(() => {
    const element = footer.current;
    if (!element) return;
    document.body.classList.add("run-toasts");
    const band = document.querySelector(".canvas-control-band");
    const update = () => {
      const top = band?.getBoundingClientRect().top ?? element.getBoundingClientRect().top;
      document.body.style.setProperty("--run-toast-bottom", `${window.innerHeight - top + 16}px`);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element); if (band) observer.observe(band); update();
    return () => { observer.disconnect(); document.body.classList.remove("run-toasts"); document.body.style.removeProperty("--run-toast-bottom"); };
  }, []);
  useEffect(() => {
    if (!replay || replay.phase === "complete") return;
    const timer = setTimeout(() => {
      const next = advanceReplay(replay);
      if (replay.phase === "running") {
        const name = run.agents[replay.index]?.name ?? "Agent";
        const outcome = nodeOutcome(replay.index, next);
        if (outcome === "warning") toast.warning(`${name} needs review`, { description: next.rule === "combined" ? "62% confidence · Duplicate flagged" : "62% confidence · Handed off without a flag", duration: 2500 });
        else if (outcome === "failed") toast.success("Duplicate caught", { description: "Held at Check duplicates · Not paid", duration: 2500 });
        else for (const index of completionAgents(replay)) toast.success(`${run.agents[index]?.name ?? "Agent"} completed`, { duration: 2500 });
      }
      if (next.phase === "complete") {
        dispatch({ type: "replay", caught: run.duplicate && next.rule === "combined", time: actionTime(), ...(!run.duplicate ? { completedRunId: run.id } : {}) });
        if (!run.duplicate) toast.success("Run completed", { description: `${run.id} · ${run.amount} payment verified`, duration: 2500 });
        else if (next.rule === "exact") toast.error("Run completed with a duplicate payment", { description: "$12,480 paid again · Duplicate was not caught", duration: 2500 });
      }
      setReplay(next);
    }, replay.phase === "running" ? 1100 : 550);
    return () => clearTimeout(timer);
  }, [replay, dispatch, run]);
  return <AppShell canvas>
    <header className="run-header flex shrink-0 flex-wrap items-center gap-4 border-b border-border bg-background px-6 py-3 max-sm:px-4" aria-label={`Run ${runId}`}>
      <Link to="/" aria-label="Back to Runs" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /></Link>
      <div><h1 className="text-xl font-semibold">{run.duplicate ? `${run.amount} paid twice` : `${run.amount} paid`}</h1><p className="text-xs text-muted-foreground">{run.id} · {run.vendor}</p></div>
      <p role="status" className={`min-w-0 flex-1 text-sm ${!running && (caught || !run.duplicate) ? "text-success" : running ? "text-muted-foreground" : "text-destructive"}`}>{running ? "Replay in progress" : !run.duplicate ? "Completed · Payment confirmed" : caught ? "Duplicate caught · Held at Check duplicates" : "Paid again, duplicate was not caught"}</p>
        <Button disabled={running} onClick={() => { setSelected(null); toast.dismiss(); setReplay(startSavedReplay(getCurrentState(), run.duplicate)); }}>{running ? <LoaderCircle className="motion-safe:animate-spin" /> : <Play />}{running ? "Replaying…" : "Replay run"}</Button>
    </header>
    <InvestigationCanvas run={run} replay={displayedReplay} paused={state.paused} onInspect={setSelected} />
    <footer ref={footer} className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-border bg-background px-6 py-4 max-sm:px-4">
      <div className="flex items-center gap-4"><h2 className="text-lg font-semibold">{run.duplicate ? "Decide" : "Run complete"}</h2><p className="text-xs text-muted-foreground">{run.duplicate ? state.paused ? "2 similar invoices paused, 1 safe to release" : "2 similar invoices queued, 1 safe to release" : `${run.po} · ${run.receipt} · ${run.date}`}</p></div>
      {run.duplicate && <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={running} onClick={() => { if (state.paused) setSelected("pause"); else { dispatch({ type: "pause", time: actionTime() }); toast.success("2 similar runs paused", { duration: 2500 }); } }}>{state.paused ? <Check /> : <Pause />}{state.paused ? "Paused, 2 runs held" : "Pause similar runs"}</Button><Button variant="secondary" disabled={running} onClick={() => setSelected("rule")}><Pencil />Edit rule</Button></div>}
    </footer>
    <InvestigationPanels run={run} panel={selected} onClose={() => setSelected(null)} />
  </AppShell>;
}
