import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileText, Pause, Pencil, Play, LoaderCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { agents, alert } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { InvestigationPanels, type InvestigationPanel } from "@/components/InvestigationPanels";
import { replayOutcome, type DuplicateRule } from "@/lib/prototype-state";

export const Route = createFileRoute("/runs/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.runId} — Ledger Watch` },
      { name: "description", content: "Agent timeline for an invoice payment run." },
      { property: "og:title", content: `Run ${params.runId} — Ledger Watch` },
      { property: "og:description", content: "Agent timeline for an invoice payment run." },
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
  const [replay, setReplay] = useState<{ step: number; rule: DuplicateRule } | null>(null);
  const [result, setResult] = useState<DuplicateRule | null>(null);
  const running = replay !== null && replay.step < 4;
  useEffect(() => {
    if (!replay || replay.step >= 4) return;
    const timer = setTimeout(() => {
      if (replay.step === 3) {
        setResult(replay.rule);
        dispatch({ type: "replay", caught: replayOutcome(replay.rule).caught, time: actionTime() });
      }
      setReplay({ ...replay, step: replay.step + 1 });
    }, 1000);
    return () => clearTimeout(timer);
  }, [replay, dispatch]);
  const displayedAgents = agents.map((agent, i) => {
    const caught = (running ? replay?.rule : result) === "combined" && (!running || (replay?.step ?? 0) > i);
    if (!caught || i === 0) return agent;
    if (i === 1) return { ...agent, summary: "Possible duplicate of INV-4821", steps: [...agent.steps.slice(0, 4), "Flagged possible duplicate of INV-4821"], evidence: agent.evidence.map((e) => e.label === "Flag raised" ? { ...e, value: "Possible duplicate of INV-4821" } : e), handoff: "Flagged possible duplicate" };
    if (i === 2) return { ...agent, status: "warning" as const, summary: "Duplicate exception raised.", steps: ["Ran vendor + amount + PO duplicate check", "Matched paid invoice INV-4821", "Raised duplicate exception", "Sent for review"], evidence: [{ label: "Rule", value: "Vendor + amount + PO" }, { label: "Duplicate of", value: "INV-4821" }, { label: "Result", value: "Exception raised" }], handoff: "Exception raised" };
    return { ...agent, status: "warning" as const, summary: "Held for review, not paid", steps: ["Received duplicate exception", "Held payment for finance review", "No payment issued"], evidence: [{ label: "Payment status", value: "Held for review, not paid" }, { label: "Amount held", value: "$12,480.00" } ] };
  });

  return (
    <AppShell>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Runs
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-4"><h1 className="text-2xl font-semibold">Run <span className="font-mono">{runId}</span></h1>
        <Button variant="outline" disabled={running} onClick={() => { setSelected(null); setResult(null); setReplay({ step: 0, rule: state.rule }); }}>{running ? <LoaderCircle className="motion-safe:animate-spin" /> : <Play />}{running ? "Replaying…" : "Replay run"}</Button>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {alert.vendor} · {alert.amount} · Paid
      </p>

      {result && !running && <div role="status" className={`mt-6 rounded-md border px-5 py-4 text-sm ${result === "combined" ? "border-primary/50 bg-primary/10 text-primary" : "border-warning/50 bg-warning/10 text-warning"}`}>{result === "combined" ? "Replay result: duplicate caught." : "Replay result: invoice paid again."}</div>}
      <div className="mt-12 overflow-x-auto pb-2"><div className="flex min-w-[780px] items-stretch">
        {displayedAgents.map((a, i) => (
          <div key={a.id} className="flex min-w-0 flex-1 items-stretch">
            <Button variant="ghost"
              aria-label={`${a.name} agent`}
              onClick={() => setSelected(a)}
              className={`h-auto min-h-[310px] w-full min-w-0 flex-col items-stretch justify-start whitespace-normal rounded-lg border bg-card p-4 text-left transition-colors hover:border-primary hover:bg-card ${
                running && replay?.step === i ? "border-primary ring-2 ring-primary/40" : typeof selected === "object" && selected?.id === a.id ? "border-primary" : a.status === "warning" ? "border-warning" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                {running && replay?.step === i ? <LoaderCircle className="h-4 w-4 text-primary motion-safe:animate-spin" /> : a.status === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="mt-3 text-lg font-semibold">{a.name}</p>
              <p className={`mt-1 min-h-10 text-sm ${a.status === "warning" ? "text-warning" : "text-muted-foreground"}`}>
                {running && replay?.step === i ? "Running…" : result === "combined" || (running && replay?.rule === "combined" && replay.step > i) ? (i === 0 ? "Completed" : a.summary) : a.status === "warning" ? "Low confidence" : "Completed"}
              </p>
              <div className="mt-5">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className={`text-3xl font-semibold ${a.status === "warning" ? "text-warning" : ""}`}>{a.confidence}%</p>
                <div className="mt-2 h-1 rounded bg-secondary">
                  <div className={`h-1 rounded ${a.status === "warning" ? "bg-warning" : "bg-primary"}`} style={{ width: `${a.confidence}%` }} />
                </div>
              </div>
              <div className="mt-5 flex flex-col gap-1.5">
                {a.documents.map((d) => (
                  <span key={d} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" /> {d}
                  </span>
                ))}
              </div>
            </Button>
            {a.handoff && (
               <div className="flex w-14 shrink-0 flex-col items-center justify-center px-1 text-center xl:w-20">
                <ArrowRight className={`h-5 w-5 ${a.status === "warning" ? "text-warning" : "text-primary"}`} />
                <span className="mt-2 text-xs text-muted-foreground">{a.handoff}</span>
              </div>
            )}
          </div>
        ))}
      </div></div>
      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
        <p className="text-sm">{state.paused ? "3 similar invoices are paused." : "3 similar invoices are queued."}</p>
        <div className="flex flex-wrap gap-3"><Button variant="outline" disabled={running} onClick={() => setSelected("pause")}><Pause />{state.paused ? "View paused runs" : "Pause similar runs"}</Button><Button variant="outline" disabled={running} onClick={() => setSelected("rule")}><Pencil />Edit rule</Button></div>
      </div>
      <InvestigationPanels panel={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
