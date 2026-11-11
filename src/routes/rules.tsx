import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Chip, PageTitle, SectionLabel, Surface } from "@/components/system";
import { AppShell } from "@/components/AppShell";
import { rules } from "@/lib/mock-data";
import { actionTime, usePrototype } from "@/components/PrototypeProvider";
import { RuleEditor } from "@/components/RuleEditor";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import type { RuleId } from "@/lib/prototype-state";
import { toast } from "sonner";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Backstop" },
      { name: "description", content: "Backstop helps finance teams watch what their AI agents do with money, and fix it when they get it wrong." },
      { property: "og:title", content: "Backstop" },
      { property: "og:description", content: "Backstop helps finance teams watch what their AI agents do with money, and fix it when they get it wrong." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const { state, dispatch } = usePrototype();
  const [open, setOpen] = useState<RuleId | null>(null);
  const openRule = rules.find((rule) => rule.id === open);
  return (
    <AppShell>
      <PageTitle>Rules</PageTitle>
      <div className="flex flex-col gap-4">
        {rules.map((rule) => (
          <Surface key={rule.id} className="flex flex-wrap items-center gap-x-6 gap-y-3 px-6 py-5">
            <div className="min-w-0 flex-1">
              <p className="flex flex-wrap items-center gap-2 font-medium">{rule.name}{rule.id === "duplicate" && !state.ruleEnabled.duplicate && <Chip tone="warning">Not protecting payments</Chip>}</p>
              <p className="mt-1 text-sm text-muted-foreground">{rule.id === "duplicate" && state.rule === "combined" ? "Blocks payment when vendor, amount and PO match a previously paid invoice." : rule.detail}</p>
              <p className="mt-2 text-xs text-muted-foreground">Last changed {rule.id === "duplicate" && state.rule === "combined" ? "today" : rule.lastChanged} · Used in {rule.usedIn} runs</p>
            </div>
            <div className="flex items-center gap-4">
              <Switch checked={state.ruleEnabled[rule.id]} aria-label={`Turn ${rule.name} on or off`}
                onCheckedChange={() => { dispatch({ type: "toggle", rule: rule.id, time: actionTime(), at: Date.now() }); toast.success(`${rule.name} turned ${state.ruleEnabled[rule.id] ? "off" : "on"}`, { id: "rule-toggle", duration: 2500 }); }} />
              <Button variant="secondary" size="sm" onClick={() => setOpen(rule.id)}>{rule.id === "duplicate" ? "Edit rule" : "View"}</Button>
            </div>
          </Surface>
        ))}
      </div>
      <Sheet open={open !== null} onOpenChange={(isOpen) => { if (!isOpen) setOpen(null); }}>
        <SheetContent className="w-full overflow-y-auto bg-card p-8 sm:max-w-md">
          <SheetTitle>{open === "duplicate" ? "Edit duplicate rule" : openRule?.name}</SheetTitle>
          <SheetDescription className="mt-2">{openRule?.detail}</SheetDescription>
          {open === "duplicate" ? <RuleEditor onSaved={() => setOpen(null)} /> : openRule && <div className="mt-8 text-sm">
            <dl className="divide-y divide-border border-y border-border">
              {[["Status", <Chip key="s" tone={state.ruleEnabled[openRule.id] ? "success" : "neutral"}>{state.ruleEnabled[openRule.id] ? "On" : "Off"}</Chip>], ["Last changed", openRule.lastChanged], ["Used in", `${openRule.usedIn} runs`], ["What it does", openRule.whatItDoes]].map(([label, value]) => (
                <div key={label as string} className="flex justify-between gap-6 py-3"><dt className="text-muted-foreground">{label}</dt><dd className="text-right">{value}</dd></div>
              ))}
            </dl>
            <SectionLabel className="mt-8">Version history</SectionLabel>
            <ol className="mt-4 border-y border-border"><li className="flex items-center justify-between gap-2 py-4">
              <div><p className="font-medium">v1 · {openRule.name}</p><p className="mt-1 text-xs text-muted-foreground">{openRule.lastChanged} · System default</p></div>
              <Chip tone="neutral">Current</Chip>
            </li></ol>
          </div>}
        </SheetContent>
      </Sheet>
    </AppShell>
  );
}
