import { Link } from "@tanstack/react-router";
import { Activity, ShieldCheck, History } from "lucide-react";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const item =
    "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground";
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <aside className="w-44 shrink-0 border-r border-border bg-sidebar px-3 py-6 lg:w-60 lg:px-4 max-sm:w-16 max-sm:px-2">
        <div className="mb-8 px-3 text-sm font-semibold max-sm:hidden">
          <span className="text-primary">●</span> Ledger Watch
        </div>
        <nav className="flex flex-col gap-1">
          <Link to="/" aria-label="Runs" className={item} activeProps={{ className: "bg-secondary !text-foreground" }} activeOptions={{ exact: true, includeSearch: false }}>
            <Activity className="h-4 w-4 shrink-0" /> <span className="max-sm:hidden">Runs</span>
          </Link>
          <Link to="/rules" aria-label="Rules" className={item} activeProps={{ className: "bg-secondary !text-foreground" }}>
            <ShieldCheck className="h-4 w-4 shrink-0" /> <span className="max-sm:hidden">Rules</span>
          </Link>
          <Link to="/activity" aria-label="Activity" className={item} activeProps={{ className: "bg-secondary !text-foreground" }}>
            <History className="h-4 w-4 shrink-0" /> <span className="max-sm:hidden">Activity</span>
          </Link>
        </nav>
      </aside>
      <main className="min-w-0 flex-1 px-6 py-10 lg:px-12 max-sm:px-4">{children}</main>
    </div>
  );
}
