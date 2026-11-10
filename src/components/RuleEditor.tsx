import { useEffect, useState } from "react";
import { Chip, Notice, SectionLabel } from "@/components/system";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { Button } from "@/components/ui/button";
import type { DuplicateRule } from "@/lib/prototype-state";

/* Duplicate-rule editor with its test box and version history, shared by the run page panel and the Rules page. */
export function RuleEditor({ onSaved }: { onSaved?: () => void }) {
  const { state, dispatch } = usePrototype();
  const [draft, setDraft] = useState<DuplicateRule>(state.rule);
  useEffect(() => { setDraft(state.rule); }, [state.rule]);
  const savedV2 = state.log.find((entry) => entry.kind === "rule" && !entry.undone);
  return <>
    <fieldset className="mt-8 space-y-4"><legend className="mb-4 text-sm font-medium">Match duplicates by</legend>
      {([{ value: "exact", label: "Exact invoice number" }, { value: "combined", label: "Vendor + amount + PO" }] as const).map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-4 text-sm"><input type="radio" name="duplicate-rule" value={option.value} disabled={state.rule === "combined" && option.value === "exact"} checked={draft === option.value} onChange={() => setDraft(option.value)} className="accent-primary" />{option.label}</label>)}
    </fieldset>
    {state.rule === "combined" && <p className="mt-3 text-sm text-muted-foreground">Restore the previous rule with Undo in Activity.</p>}
    <Notice role="status" tone={draft === "combined" ? "success" : "warning"} className="mt-4">
      {draft === "combined" ? "Tested on the last 30 days: would hold 2 duplicates, would not hold 1 legitimate invoice, 0 false flags." : "Would hold 0 of the 2 duplicates."}
    </Notice>
    <Button className="mt-6 w-full" disabled={draft === state.rule} onClick={() => { dispatch({ type: "rule", rule: draft, time: actionTime() }); onSaved?.(); }}>Save</Button>
    <SectionLabel className="mt-10">Version history</SectionLabel>
    <ol className="mt-4 divide-y divide-border border-y border-border text-sm">
      <li className="flex flex-wrap items-center justify-between gap-2 py-4">
        <div><p className="font-medium">v2 · Fuzzy match on vendor, amount and PO</p><p className="mt-1 text-xs text-muted-foreground">{state.rule === "combined" ? `${savedV2 ? `${savedV2.time} · ` : ""}Neha Hiremath` : "Not active"}</p></div>
        {state.rule === "combined" && <Chip tone="success">Current</Chip>}
      </li>
      <li className="flex flex-wrap items-center justify-between gap-2 py-4">
        <div><p className="font-medium">v1 · Exact invoice number match</p><p className="mt-1 text-xs text-muted-foreground">Oct 2, 2026 · System default</p></div>
        {state.rule === "exact" && <Chip tone="neutral">Current</Chip>}
      </li>
    </ol>
  </>;
}
