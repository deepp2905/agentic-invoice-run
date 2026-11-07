import { Link } from "@tanstack/react-router";
import { Activity, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const item =
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar px-4 py-6">
        <div className="mb-8 px-3 text-sm font-semibold tracking-wide">
          <span className="text-primary">●</span> Ledger Watch
        </div>
        <nav className="flex flex-col gap-1">
          <Link to="/" className={item} activeProps={{ className: "bg-secondary !text-foreground" }} activeOptions={{ exact: false, includeSearch: false }}>
            <Activity className="h-4 w-4" /> Runs
          </Link>
          <Link to="/rules" className={item} activeProps={{ className: "bg-secondary !text-foreground" }}>
            <ShieldCheck className="h-4 w-4" /> Rules
          </Link>
        </nav>
      </aside>
      <main className="flex-1 px-12 py-10">{children}</main>
    </div>
  );
}
