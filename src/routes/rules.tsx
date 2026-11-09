import { createFileRoute } from "@tanstack/react-router";
import { PageTitle, Surface } from "@/components/system";
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
      <PageTitle>Rules</PageTitle>
      <div className="flex flex-col gap-4">
        {rules.map((r) => (
          <Surface key={r.name} className="px-6 py-5">
            <p className="font-medium">{r.name}</p>
            <p className="mt-1 text-sm text-muted-foreground">{r.name === "Duplicate invoice check" && state.rule === "combined" ? "Blocks payment when vendor, amount and PO match a previously paid invoice." : r.detail}</p>
          </Surface>
        ))}
      </div>
    </AppShell>
  );
}
