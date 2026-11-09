import { useEffect, useState } from "react";
import { IconAlertTriangle as AlertTriangle } from "@tabler/icons-react";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { queuedInvoices, type DuplicateRule } from "@/lib/prototype-state";
import type { Agent } from "@/lib/mock-data";

export type InvestigationPanel = Agent | "pause" | "rule" | null;
export function InvestigationPanels({ panel, onClose }: { panel: InvestigationPanel; onClose: () => void }) {
  const { state, dispatch } = usePrototype();
  const [draft, setDraft] = useState<DuplicateRule>(state.rule);
  useEffect(() => { if (panel === "rule") setDraft(state.rule); }, [panel, state.rule]);
  const agent = typeof panel === "object" ? panel : null;
  return <Sheet open={panel !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent className="w-full overflow-y-auto bg-card p-8 sm:max-w-[480px]">
      <SheetTitle>{agent?.name ?? (panel === "pause" ? "Similar queued invoices" : "Edit duplicate rule")}</SheetTitle>
      <SheetDescription className="mt-2">{agent?.summary ?? (panel === "pause" ? `Harbor Office Supply · PO-7710 · ${state.paused ? "Paused" : "3 queued"}` : "Duplicate invoice check")}</SheetDescription>
      {agent && <>
        {agent.id === "matching" && <section className="mt-7">
          <h3 className="font-medium">Why did it do that?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Vendor, amount and PO matched an earlier invoice, but the invoice number differed by one suffix, so confidence dropped to 62%. It handed off without a flag.</p>
        </section>}
        {agent.id === "policy" && <section className="mt-7 border-y border-border py-4 text-sm">
          <p className="font-medium">Duplicate check: {state.rule === "exact" ? "matches exact invoice number only" : "matches vendor + amount + PO"}</p>
          <p className={`mt-3 ${agent.summary.includes("exception") ? "text-warning" : "text-primary"}`}>Result: {agent.summary.includes("exception") ? "Exception raised" : "Passed"}</p>
          <p className="mt-2 text-muted-foreground">{agent.summary.includes("exception") ? "Vendor, amount and PO match INV-4821." : "No match found because the numbers differ."}</p>
        </section>}
        <h3 className="mt-8 text-xs uppercase text-muted-foreground">Steps</h3>
        <ol className="mt-4 flex flex-col gap-4">{agent.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">{i + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol>
        <h3 className="mt-8 text-xs uppercase text-muted-foreground">Evidence</h3>
        {agent.id === "matching" && <>
          <div className="mt-4 grid grid-cols-2 divide-x divide-border rounded-md border border-border text-sm">
            {[{ invoice: "INV-4821", date: "Paid Oct 29" }, { invoice: "INV-4821-A", date: "Nov 7" }].map((invoice) => <div key={invoice.invoice} className="space-y-4 p-3">
              <div><p className="text-xs text-muted-foreground">Invoice number</p><p className="mt-1 break-all font-mono text-warning">{invoice.invoice}</p></div>
              <div><p className="text-xs text-muted-foreground">Date</p><p className="mt-1">{invoice.date}</p></div>
              <div><p className="text-xs text-muted-foreground">Vendor</p><p className="mt-1 text-primary">Harbor Office Supply</p></div>
              <div><p className="text-xs text-muted-foreground">Amount</p><p className="mt-1 text-primary">$12,480</p></div>
              <div><p className="text-xs text-muted-foreground">PO</p><p className="mt-1 text-primary">PO-7710</p></div>
            </div>)}
          </div>
          <p className="mt-4 flex items-start gap-2 text-sm text-warning"><AlertTriangle className="h-4 w-4 shrink-0" />This is where the duplicate should have been caught.</p>
        </>}
        <dl className="mt-4 divide-y divide-border rounded-md border border-border">{agent.evidence.map((e) => <div key={e.label} className="px-4 py-3"><dt className="text-xs text-muted-foreground">{e.label}</dt><dd className="mt-1 text-sm">{e.value}</dd></div>)}</dl>
      </>}
      {panel === "pause" && <>
        <ul className="mt-6 divide-y divide-border border-y border-border">{queuedInvoices.map((invoice) => <li key={invoice.id} className="py-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-mono">{invoice.id}</span><span className={invoice.legit ? "text-primary" : state.paused ? "text-warning" : "text-muted-foreground"}>{invoice.legit ? "Not a duplicate" : state.paused ? "Paused" : "Queued"}</span></div><p className="mt-2 text-muted-foreground">{invoice.vendor}</p><p className="mt-1 text-muted-foreground">{invoice.amount} · {invoice.po}</p>{invoice.legit && <p className="mt-2 w-fit rounded border border-primary/25 bg-primary/10 px-2 py-1 text-xs text-primary">Not a duplicate, safe to release</p>}</li>)}</ul>
        <Button className="mt-6 w-full" disabled={state.paused} onClick={() => dispatch({ type: "pause", time: actionTime() })}>{state.paused ? "3 runs paused" : "Confirm pause"}</Button>
      </>}
      {panel === "rule" && <>
        <fieldset className="mt-8 space-y-4"><legend className="mb-4 text-sm font-medium">Match duplicates by</legend>
          {([{ value: "exact", label: "Exact invoice number" }, { value: "combined", label: "Vendor + amount + PO" }] as const).map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 text-sm"><input type="radio" name="duplicate-rule" value={option.value} checked={draft === option.value} onChange={() => setDraft(option.value)} className="accent-primary" />{option.label}</label>)}
        </fieldset>
        <div role="status" className={`mt-4 rounded-md border px-4 py-3 text-sm ${draft === "combined" ? "border-primary/25 bg-primary/10 text-primary" : "border-warning/25 bg-warning/10 text-warning"}`}>
          {draft === "combined" ? "Tested on the last 30 days: would hold 2 duplicates, would not hold 1 legitimate invoice, 0 false flags." : "Would hold 0 of the 2 duplicates."}
        </div>
        <Button className="mt-6 w-full" disabled={draft === state.rule} onClick={() => { dispatch({ type: "rule", rule: draft, time: actionTime() }); onClose(); }}>Save</Button>
      </>}
    </SheetContent>
  </Sheet>;
}