import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Chip, Notice, PageTitle, Surface } from "@/components/system";
import { IconAlertTriangle as AlertTriangle, IconArrowRight as ArrowRight, IconCircleCheck as CircleCheck, IconSearch as Search } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { alert, runs } from "@/lib/mock-data";
import { runStatus, runStatusMeta } from "@/lib/prototype-state";
import { usePrototype } from "@/components/PrototypeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledger Watch" },
      { name: "description", content: "Monitor AI agent runs processing vendor invoices." },
      { property: "og:title", content: "Runs — Ledger Watch" },
      { property: "og:description", content: "Monitor AI agent runs processing vendor invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunsPage,
});

type Tab = "all" | "attention" | "paused";
const tabs: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "attention", label: "Needs attention" },
  { id: "paused", label: "Paused" },
];

function RunsPage() {
  const { state, dispatch } = usePrototype();
  const [tab, setTab] = useState<Tab>("all");
  const [query, setQuery] = useState("");
  const rows = runs.map((run) => ({ ...run, status: runStatus(run.id, state) }));
  const needsAttention = (status: (typeof rows)[number]["status"]) => status === "paid-twice" || status === "paused";
  const counts: Record<Tab, number> = {
    all: rows.length,
    attention: rows.filter((row) => needsAttention(row.status)).length,
    paused: rows.filter((row) => row.status === "paused").length,
  };
  const term = query.trim().toLowerCase();
  const visible = rows.filter((row) =>
    (tab === "all" || (tab === "attention" ? needsAttention(row.status) : row.status === "paused")) &&
    (!term || row.id.toLowerCase().includes(term) || row.vendor.toLowerCase().includes(term)));
  const held = runStatus(alert.runId, state) === "held";
  const checkOff = !state.ruleEnabled.duplicate;
  return (
    <AppShell>
      <Notice tone={held ? "success" : "destructive"} size="lg" icon={held ? CircleCheck : AlertTriangle} className="mb-3" action={<Button asChild variant={held ? "secondary" : "default"}><Link to="/runs/$runId" onClick={() => dispatch({ type: "investigate" })} params={{ runId: alert.runId }}>{held ? "View run" : "Investigate"}</Link></Button>}>
        {held ? <>
          <p className="text-base font-medium">Invoice {alert.invoice} duplicate caught, payment held.</p>
          <p className="mt-1 text-muted-foreground">Vendor: {alert.vendor} · {alert.amount} not paid</p>
        </> : <>
          <p className="text-base font-medium">Invoice {alert.invoice} was paid twice, {alert.amount}.</p>
          <p className="mt-1 text-muted-foreground">Vendor: {alert.vendor}{checkOff ? " · Duplicate check is off" : ""}</p>
        </>}
      </Notice>
      <div className="mb-10">{!held && !state.investigated && <p className="text-sm text-muted-foreground">Start here: click Investigate to see what the agent did.</p>}</div>

      <PageTitle>Runs</PageTitle>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex gap-2" role="tablist" aria-label="Filter runs">
          {tabs.map((item) => (
            <button key={item.id} role="tab" aria-selected={tab === item.id} onClick={() => setTab(item.id)}
              className={`rounded-sm px-3 py-1.5 text-sm transition-colors ${tab === item.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {item.label} <span className="ml-1 text-xs text-muted-foreground">{counts[item.id]}</span>
            </button>
          ))}
        </div>
        <div className="relative ml-auto">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search invoice or vendor" aria-label="Search runs" className="w-64 pl-9" />
        </div>
      </div>
      <Surface className="overflow-x-auto bg-transparent">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted-foreground">
            <tr>
              {["Run", "Vendor", "Amount", "Status", "Time"].map((h) => (
                <th key={h} className="px-6 py-4 font-medium">{h}</th>
              ))}
              <th className="px-6 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const meta = runStatusMeta[r.status];
              const investigate = r.id === "INV-4821-A" && !held;
              return (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-6 py-4"><span className="font-mono">{r.id}</span>{(r.id === "INV-4821" || investigate || r.id === "INV-4821-B" || r.id === "INV-4821-C") && <Chip tone="warning" className="mt-2 flex bg-transparent px-0">Possible duplicate</Chip>}{r.id === "INV-4821-D" && <Chip tone="success" className="mt-2 flex bg-transparent px-0">Not a duplicate</Chip>}</td>
                  <td className="px-6 py-4">{r.vendor}</td>
                  <td className="px-6 py-4">{r.amount}</td>
                  <td className="px-6 py-4"><Chip tone={meta.tone}>{meta.label}</Chip></td>
                  <td className="px-6 py-4 text-muted-foreground">{r.date}</td>
                  <td className="px-6 py-4 text-right">
                    <Button asChild size="sm" className="w-32 justify-between" variant={investigate ? "warning" : "secondary"}>
                      <Link to="/runs/$runId" params={{ runId: r.id }} onClick={() => { if (investigate) dispatch({ type: "investigate" }); }}>
                        {investigate ? "Investigate" : "View run"}
                        <ArrowRight className="size-4" />
                      </Link>
                    </Button>
                  </td>
                </tr>
              );
            })}
            {visible.length === 0 && <tr><td colSpan={6} className="px-6 py-10 text-center text-muted-foreground">No runs match this filter.</td></tr>}
          </tbody>
        </table>
      </Surface>
    </AppShell>
  );
}
