import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { rules } from "@/lib/mock-data";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules — Ledger Watch" },
      { name: "description", content: "Policy rules applied by invoice agents." },
      { property: "og:title", content: "Rules — Ledger Watch" },
      { property: "og:description", content: "Policy rules applied by invoice agents." },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Rules</h1>
      <div className="flex flex-col gap-4">
        {rules.map((r) => (
          <div key={r.name} className="rounded-lg border border-border bg-card px-6 py-5">
            <p className="font-medium">{r.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{r.detail}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
