import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Pause, Pencil, Play } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { agents } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { InvestigationPanels, type InvestigationPanel } from "@/components/InvestigationPanels";
import { queuedInvoices, replayOutcome, type DuplicateRule } from "@/lib/prototype-state";

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

function Slip({ id, amount, note, tone = "default" }: { id: string; amount?: string | undefined; note?: string | undefined; tone?: "default" | "warning" | "primary" | undefined }) {
  const toneClass = tone === "warning" ? "border-warning text-warning" : tone === "primary" ? "border-primary text-primary" : "border-border text-foreground";
  return (
    <div className={`border bg-card px-3 py-2 ${toneClass}`}>
      <p className="font-mono text-xs font-medium whitespace-nowrap">{id}{amount ? ` · ${amount}` : ""}</p>
      {note && <p className="mt-1 text-[10px] uppercase tracking-widest">{note}</p>}
    </div>
  );
}

function RunView() {
  const { runId } = Route.useParams();
  const { state, dispatch } = usePrototype();
  const [selected, setSelected] = useState<InvestigationPanel>(null);
  const [replay, setReplay] = useState<{ step: number; rule: DuplicateRule } | null>(null);
  const [result, setResult] = useState<DuplicateRule | null>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  const running = replay !== null && replay.step < 4;
  const activeRule = running ? replay?.rule : result;
  const caught = activeRule === "combined";
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

  // Slip position along the belt: 12.5%..87.5% are station centers, 100% is the tray.
  const step = replay?.step ?? 0;
  const slipLeft = replay === null
    ? "0%"
    : caught
      ? `${Math.min(step, 2) * 25 + 12.5}%`
      : step >= 4
        ? "100%"
        : `${step * 25 + 12.5}%`;

  const stationState = (i: number): "running" | "pass" | "warn" | "flag" | "held" | "notpaid" => {
    if (running && step === i) return "running";
    const past = running ? step > i : true;
    if (caught && past) {
      if (i === 1) return "flag";
      if (i === 2) return "held";
      if (i === 3) return "notpaid";
      return "pass";
    }
    return i === 1 ? "warn" : "pass";
  };
  const stationLabel = (i: number): string => {
    const s = stationState(i);
    if (s === "running") return "Running…";
    if (s === "flag") return "Possible duplicate of INV-4821";
    if (s === "held") return "Held for review";
    if (s === "notpaid") return "Not paid";
    if (s === "warn") return result === "exact" ? "62%, handed off without a flag" : "Low confidence";
    return "Completed";
  };
  const lightClass = (i: number): string => {
    const s = stationState(i);
    if (s === "warn" || s === "flag") return "bg-warning";
    if (s === "held") return "bg-destructive";
    if (s === "notpaid") return "bg-muted-foreground";
    return "bg-primary";
  };

  return (
    <AppShell>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Runs
      </Link>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-4xl font-semibold uppercase tracking-wide sm:text-5xl">$12,480 paid twice</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Incident: <span className="font-mono">{runId}</span>, Nov 7, 09:14, Harbor Office Supply
          </p>
        </div>
        <Button variant="outline" disabled={running} onClick={() => { setSelected(null); setResult(null); setReplay({ step: 0, rule: state.rule }); }}>
          {running ? <LoaderCircle className="motion-safe:animate-spin" /> : <Play />}{running ? "Replaying…" : "Replay run"}
        </Button>
      </div>

      {result && !running && (
        <div role="status" className={`mt-8 border-2 px-5 py-4 font-serif text-lg font-semibold uppercase tracking-widest ${caught ? "border-primary text-primary" : "border-destructive text-destructive"}`}>
          {caught ? "Duplicate caught" : "Paid again"}
        </div>
      )}

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[170px_minmax(0,1fr)_190px]">
        {/* Queued invoices waiting in line */}
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Queued</p>
          <div className="flex flex-col gap-2">
            {queuedInvoices.map((invoice) => (
              <Slip
                key={invoice.id}
                id={invoice.id}
                tone={invoice.legit ? "primary" : state.paused ? "warning" : "default"}
                note={invoice.legit ? "Not a duplicate, safe to release" : state.paused ? "Paused" : undefined}
              />
            ))}
          </div>
        </div>

        {/* Conveyor belt with four gate stations */}
        <div className="relative min-w-0 pt-2 pb-6">
          <div className="absolute inset-x-0 top-[26px] h-0.5 bg-border" aria-hidden="true" />
          <div
            className={`absolute top-[4px] z-10 -translate-x-1/2 ${reducedMotion ? "" : "transition-[left] duration-1000 ease-linear"} ${replay !== null && step >= 4 && !caught ? "opacity-0" : ""}`}
            style={{ left: slipLeft }}
            aria-hidden="true"
          >
            <Slip id="INV-4821-A" amount="$12,480" tone={caught && (running ? step > 2 : true) ? "warning" : "default"} />
          </div>
          <div className="relative mt-20 grid grid-cols-2 items-start gap-4 sm:grid-cols-4">
            {agents.map((a, i) => {
              const s = stationState(i);
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-label={`${a.name} station`}
                  onClick={() => setSelected(a)}
                  className={`flex flex-col border bg-card text-left transition-colors hover:border-primary ${s === "held" ? "border-destructive" : s === "warn" || s === "flag" ? "border-warning" : "border-border"}`}
                >
                  <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
                    <span className="min-w-0 truncate text-xs font-medium uppercase tracking-widest">{a.name}</span>
                    {s === "running" ? <LoaderCircle className="h-3.5 w-3.5 shrink-0 text-primary motion-safe:animate-spin" /> : <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${lightClass(i)}`} aria-label={`Status: ${s}`} />}
                  </div>
                  <div className="px-3 py-4">
                    {s === "held" && <div className="mb-3 h-1 w-full bg-destructive" aria-hidden="true" />}
                    <p className="font-mono text-2xl font-medium">{a.confidence}%</p>
                    <p className={`mt-2 min-h-8 text-xs leading-relaxed ${s === "held" ? "text-destructive" : s === "warn" || s === "flag" ? "text-warning" : "text-muted-foreground"}`}>
                      {stationLabel(i)}
                    </p>
                  </div>
                  {i === 1 && !caught && (
                    <span className="mx-3 mb-3 w-fit border border-warning px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-warning">
                      Should have been caught
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Output tray */}
        <div>
          <p className="mb-3 text-xs uppercase tracking-widest text-muted-foreground">Output tray</p>
          <div className="flex flex-col gap-2 border border-dashed border-border p-3">
            <Slip id="INV-4821" note="Paid Oct 29" />
            {result === "exact" && !running && <Slip id="INV-4821-A" amount="$12,480" tone="warning" note="Paid again" />}
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-border py-5">
        <h2 className="font-serif text-lg font-semibold uppercase tracking-wide">Decide</h2>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-sm text-muted-foreground">{state.paused ? "3 similar invoices are paused." : "3 similar invoices are queued."}</p>
          <Button variant="outline" disabled={running} onClick={() => setSelected("pause")}><Pause />{state.paused ? "View paused runs" : "Pause similar runs"}</Button>
          <Button variant="outline" disabled={running} onClick={() => setSelected("rule")}><Pencil />Edit rule</Button>
        </div>
      </div>
      <InvestigationPanels panel={selected} onClose={() => setSelected(null)} />
    </AppShell>
  );
}
