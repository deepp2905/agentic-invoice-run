import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { rules } from "@/lib/mock-data";
import { usePrototype } from "@/components/PrototypeProvider";

export const Route = createFileRoute("/rules")({
  head: () => ({
    meta: [
      { title: "Rules — Ledger Watch" },
      { name: "description", content: "Policy rules applied by invoice agents." },
      { property: "og:title", content: "Rules — Ledger Watch" },
      { property: "og:description", content: "Policy rules applied by invoice agents." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RulesPage,
});

function RulesPage() {
  const { state } = usePrototype();
  return (
    <AppShell>
      <h1 className="mb-6 text-2xl font-semibold">Rules</h1>
      <div className="flex flex-col gap-4">
        {rules.map((r) => (
          <div key={r.name} className="rounded-lg border border-border bg-card px-6 py-5">
            <p className="font-medium">{r.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{r.name === "Duplicate invoice check" && state.rule === "combined" ? "Blocks payment when vendor, amount and PO match a previously paid invoice." : r.detail}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
