import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, CheckCircle2, FileText, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { agents, alert, type Agent } from "@/lib/mock-data";

export const Route = createFileRoute("/runs/$runId")({
  head: ({ params }) => ({
    meta: [
      { title: `Run ${params.runId} — Ledger Watch` },
      { name: "description", content: "Agent timeline for an invoice payment run." },
      { property: "og:title", content: `Run ${params.runId} — Ledger Watch` },
      { property: "og:description", content: "Agent timeline for an invoice payment run." },
    ],
  }),
  component: RunView,
});

function RunView() {
  const { runId } = Route.useParams();
  const [selected, setSelected] = useState<Agent | null>(null);

  return (
    <AppShell>
      <Link to="/" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Runs
      </Link>
      <h1 className="text-2xl font-semibold">Run <span className="font-mono">{runId}</span></h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {alert.vendor} · {alert.amount} · Paid
      </p>

      <div className="mt-12 flex items-stretch">
        {agents.map((a, i) => (
          <div key={a.id} className="flex flex-1 items-stretch">
            <button
              onClick={() => setSelected(a)}
              className={`flex w-full flex-col rounded-lg border bg-card p-5 text-left transition-colors hover:border-primary ${
                selected?.id === a.id ? "border-primary" : a.status === "warning" ? "border-warning" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-muted-foreground">Step {i + 1}</span>
                {a.status === "warning" ? (
                  <AlertTriangle className="h-4 w-4 text-warning" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                )}
              </div>
              <p className="mt-3 text-lg font-semibold">{a.name}</p>
              <p className={`mt-1 text-sm ${a.status === "warning" ? "text-warning" : "text-muted-foreground"}`}>
                {a.status === "warning" ? "Low confidence" : "Completed"}
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
            </button>
            {a.handoff && (
              <div className="flex w-28 shrink-0 flex-col items-center justify-center px-2 text-center">
                <ArrowRight className={`h-5 w-5 ${a.status === "warning" ? "text-warning" : "text-primary"}`} />
                <span className="mt-2 text-xs text-muted-foreground">{a.handoff}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {selected && (
        <>
          <div className="fixed inset-0 bg-background/60" onClick={() => setSelected(null)} />
          <aside className="fixed inset-y-0 right-0 w-[420px] overflow-y-auto border-l border-border bg-card p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">{selected.name}</h2>
              <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground" aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{selected.summary}</p>

            <h3 className="mt-8 text-xs uppercase tracking-wider text-muted-foreground">Steps</h3>
            <ol className="mt-4 flex flex-col gap-4">
              {selected.steps.map((s, i) => (
                <li key={s} className="flex gap-3 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">{i + 1}</span>
                  <span className="pt-0.5">{s}</span>
                </li>
              ))}
            </ol>

            <h3 className="mt-8 text-xs uppercase tracking-wider text-muted-foreground">Evidence</h3>
            <dl className="mt-4 flex flex-col divide-y divide-border rounded-lg border border-border">
              {selected.evidence.map((e) => (
                <div key={e.label} className="px-4 py-3">
                  <dt className="text-xs text-muted-foreground">{e.label}</dt>
                  <dd className="mt-1 text-sm">{e.value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        </>
      )}
    </AppShell>
  );
}
