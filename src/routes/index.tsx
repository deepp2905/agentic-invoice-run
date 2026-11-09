import { createFileRoute, Link } from "@tanstack/react-router";
import { IconAlertTriangle as AlertTriangle } from "@tabler/icons-react";
import { AppShell } from "@/components/AppShell";
import { alert, runs } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Runs — Ledger Watch" },
      { name: "description", content: "Monitor AI agent runs processing vendor invoices." },
      { property: "og:title", content: "Runs — Ledger Watch" },
      { property: "og:description", content: "Monitor AI agent runs processing vendor invoices." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunsPage,
});

function RunsPage() {
  return (
    <AppShell>
      <div className="mb-10 flex flex-wrap items-center justify-between gap-6 rounded-lg border border-destructive/25 bg-destructive/10 px-6 py-5">
        <div className="flex items-start gap-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <div>
            <p className="font-medium">
              Invoice {alert.invoice} was paid twice, {alert.amount}.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">Vendor: {alert.vendor}</p>
          </div>
        </div>
        <Button asChild><Link
          to="/runs/$runId"
          params={{ runId: alert.runId }}
        >
          Investigate
        </Link></Button>
      </div>

      <h1 className="mb-6 text-2xl font-semibold">Runs</h1>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted-foreground">
            <tr>
              {["Run", "Vendor", "Amount", "Status", "Date"].map((h) => (
                <th key={h} className="px-6 py-4 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-6 py-4"><span className="font-mono">{r.id}</span>{(r.id === "INV-4821" || r.id === "INV-4821-A") && <span className="mt-2 block w-fit whitespace-nowrap rounded border border-warning/25 bg-warning/10 px-2 py-1 text-xs text-warning">Possible duplicate</span>}</td>
                <td className="px-6 py-4">{r.vendor}</td>
                <td className="px-6 py-4">{r.amount}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.status}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}
