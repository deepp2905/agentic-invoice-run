import { useEffect, useState } from "react";
import { Chip, Field, Notice, SectionLabel, toneText } from "@/components/system";
import { IconAlertTriangle as AlertTriangle } from "@tabler/icons-react";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { queuedInvoices, queuedInvoiceState, type DuplicateRule } from "@/lib/prototype-state";
import { toast } from "sonner";
import type { Agent } from "@/lib/mock-data";

export type InvestigationPanel = Agent | "pause" | "rule" | null;
export function InvestigationPanels({ panel, onClose }: { panel: InvestigationPanel; onClose: () => void }) {
  const { state, dispatch } = usePrototype();
  const [draft, setDraft] = useState<DuplicateRule>(state.rule);
  useEffect(() => { if (panel === "rule") setDraft(state.rule); }, [panel, state.rule]);
  const agent = typeof panel === "object" ? panel : null;
  return <Sheet open={panel !== null} onOpenChange={(open) => { if (!open) onClose(); }}>
    <SheetContent className="w-full overflow-y-auto bg-card p-8 sm:max-w-md">
      <SheetTitle>{agent?.name ?? (panel === "pause" ? "Similar queued invoices" : "Edit duplicate rule")}</SheetTitle>
      <SheetDescription className="mt-2">{agent?.summary ?? (panel === "pause" ? `Harbor Office Supply · ${state.paused ? "2 paused, 1 safe to release" : "2 queued, 1 safe to release"}` : "Duplicate invoice check")}</SheetDescription>
      {agent && <>
        {agent.id === "matching" && <section className="mt-7">
          <h3 className="font-medium">Why did it do that?</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Vendor, amount and PO matched an earlier invoice, but the invoice number differed by one suffix, so confidence dropped to 62%. It handed off without a flag.</p>
        </section>}
        {agent.id === "policy" && <section className="mt-7 border-y border-border py-4 text-sm">
          <p className="font-medium">Duplicate check: {state.rule === "exact" ? "matches exact invoice number only" : "matches vendor + amount + PO"}</p>
          <p className={`mt-3 ${toneText[agent.summary.includes("exception") ? "warning" : "success"]}`}>Result: {agent.summary.includes("exception") ? "Exception raised" : "Passed"}</p>
          <p className="mt-2 text-muted-foreground">{agent.summary.includes("exception") ? "Vendor, amount and PO match INV-4821." : "No match found because the numbers differ."}</p>
        </section>}
        <SectionLabel className="mt-8">Steps</SectionLabel>
        <ol className="mt-4 flex flex-col gap-4">{agent.steps.map((step, i) => <li key={step} className="flex gap-3 text-sm"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-secondary text-xs">{i + 1}</span><span className="pt-0.5">{step}</span></li>)}</ol>
        <SectionLabel className="mt-8">Evidence</SectionLabel>
        {agent.id === "matching" && <>
          <div className="mt-4 grid grid-cols-2 divide-x divide-border rounded-md border border-border text-sm">
            {[{ invoice: "INV-4821", date: "Paid Oct 29" }, { invoice: "INV-4821-A", date: "Nov 7" }].map((invoice) => <div key={invoice.invoice} className="space-y-4 p-3">
              <Field label="Invoice number" tone="warning"><span className="break-all font-mono">{invoice.invoice}</span></Field>
              <Field label="Date">{invoice.date}</Field>
              <Field label="Vendor" tone="success">Harbor Office Supply</Field>
              <Field label="Amount" tone="success">$12,480</Field>
              <Field label="PO" tone="success">PO-7710</Field>
            </div>)}
          </div>
          <Notice tone="warning" icon={AlertTriangle} className="mt-4">This is where the duplicate should have been caught.</Notice>
        </>}
        <dl className="mt-4 divide-y divide-border rounded-md border border-border">{agent.evidence.map((e) => <div key={e.label} className="px-4 py-3"><dt className="text-xs text-muted-foreground">{e.label}</dt><dd className="mt-1 text-sm">{e.value}</dd></div>)}</dl>
      </>}
      {panel === "pause" && <>
        <ul className="mt-6 divide-y divide-border border-y border-border">{queuedInvoices.map((invoice) => {
          const status = queuedInvoiceState(invoice, state.paused);
          return <li key={invoice.id} className="py-4 text-sm"><div className="flex items-center justify-between gap-3"><span className="font-mono">{invoice.id}</span><span className={toneText[status === "safe" ? "success" : status === "paused" ? "warning" : "neutral"]}>{status === "safe" ? "Safe to release" : status === "paused" ? "Paused" : "Queued"}</span></div><p className="mt-2 text-muted-foreground">{invoice.vendor}</p><p className="mt-1 text-muted-foreground">{invoice.amount} · {invoice.po}</p>{invoice.legit && <Chip tone="success" className="mt-2">Not a duplicate, safe to release</Chip>}</li>;
        })}</ul>
        <Button className="mt-6 w-full" disabled={state.paused} onClick={() => { dispatch({ type: "pause", time: actionTime() }); toast.success("2 similar runs paused", { duration: 2500 }); }}>{state.paused ? "2 runs paused" : "Confirm pause"}</Button>
      </>}
      {panel === "rule" && <>
        <fieldset className="mt-8 space-y-4"><legend className="mb-4 text-sm font-medium">Match duplicates by</legend>
          {([{ value: "exact", label: "Exact invoice number" }, { value: "combined", label: "Vendor + amount + PO" }] as const).map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 text-sm"><input type="radio" name="duplicate-rule" value={option.value} disabled={state.rule === "combined" && option.value === "exact"} checked={draft === option.value} onChange={() => setDraft(option.value)} className="accent-primary" />{option.label}</label>)}
        </fieldset>
        {state.rule === "combined" && <p className="mt-3 text-sm text-muted-foreground">Restore the previous rule with Undo in Activity.</p>}
        <Notice role="status" tone={draft === "combined" ? "success" : "warning"} className="mt-4">
          {draft === "combined" ? "Tested on the last 30 days: would hold 2 duplicates, would not hold 1 legitimate invoice, 0 false flags." : "Would hold 0 of the 2 duplicates."}
        </Notice>
        <Button className="mt-6 w-full" disabled={draft === state.rule} onClick={() => { dispatch({ type: "rule", rule: draft, time: actionTime() }); onClose(); }}>Save</Button>
      </>}
    </SheetContent>
  </Sheet>;
}