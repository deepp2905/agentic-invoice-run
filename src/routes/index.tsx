import { createFileRoute, Link } from "@tanstack/react-router";
import { Chip, Notice, PageTitle, Surface } from "@/components/system";
import { IconAlertTriangle as AlertTriangle, IconArrowRight as ArrowRight } from "@tabler/icons-react";
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
      <Notice tone="destructive" size="lg" icon={AlertTriangle} className="mb-10" action={<Button asChild><Link to="/runs/$runId" params={{ runId: alert.runId }}>Investigate</Link></Button>}>
        <p className="text-base font-medium">Invoice {alert.invoice} was paid twice, {alert.amount}.</p>
        <p className="mt-1 text-muted-foreground">Vendor: {alert.vendor}</p>
      </Notice>

      <PageTitle>Runs</PageTitle>
      <Surface className="overflow-x-auto bg-transparent">
        <table className="w-full text-sm">
          <thead className="bg-card text-left text-muted-foreground">
            <tr>
              {["Run", "Vendor", "Amount", "Status", "Date"].map((h) => (
                <th key={h} className="px-6 py-4 font-medium">{h}</th>
              ))}
              <th className="px-6 py-4 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((r) => (
              <tr key={r.id} className="border-t border-border">
                <td className="px-6 py-4"><span className="font-mono">{r.id}</span>{(r.id === "INV-4821" || r.id === "INV-4821-A") && <Chip tone="warning" className="mt-2 flex bg-transparent px-0">Possible duplicate</Chip>}</td>
                <td className="px-6 py-4">{r.vendor}</td>
                <td className="px-6 py-4">{r.amount}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.status}</td>
                <td className="px-6 py-4 text-muted-foreground">{r.date}</td>
                <td className="px-6 py-4 text-right">
                  <Button asChild size="sm" className="w-32 justify-between" variant={r.id.startsWith("INV-4821") ? "warning" : "secondary"}>
                    <Link to="/runs/$runId" params={{ runId: r.id.startsWith("INV-4821") ? alert.runId : r.id }}>
                      {r.id.startsWith("INV-4821") ? "Investigate" : "View run"}
                      <ArrowRight className="size-4" />
                    </Link>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Surface>
    </AppShell>
  );
}
