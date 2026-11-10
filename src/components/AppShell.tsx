import { Link } from "@tanstack/react-router";
import { IconActivity as Activity, IconShieldCheck as ShieldCheck, IconHistory as History, IconLayoutSidebarLeftCollapse as PanelLeftClose, IconLayoutSidebarLeftExpand as PanelLeftOpen, IconRestore as Restore } from "@tabler/icons-react";
import { Hint } from "@/components/Hint";
import { Avatar } from "@/components/system";
import { usePrototype } from "@/components/PrototypeProvider";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

const nav = [
  { to: "/", label: "Runs", icon: Activity, exact: true },
  { to: "/rules", label: "Rules", icon: ShieldCheck, exact: false },
  { to: "/activity", label: "Activity", icon: History, exact: false },
] as const;

export function AppShell({ children, canvas = false }: { children: ReactNode; canvas?: boolean }) {
  const { dispatch } = usePrototype();
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => { setCollapsed(localStorage.getItem("sidebar-collapsed") === "1"); }, []);
  const toggle = () => setCollapsed(c => { localStorage.setItem("sidebar-collapsed", c ? "0" : "1"); return !c; });
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <div className={`flex w-full bg-background text-foreground ${canvas ? "h-dvh overflow-hidden" : "min-h-screen"}`}>
      <aside className={`sticky top-0 flex h-dvh shrink-0 flex-col border-r border-border bg-sidebar py-4 transition-[width] duration-200 ${collapsed ? "w-16 px-2" : "w-60 px-3"}`}>
        <div className={`mb-6 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between px-2"}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">LW</span>
            {!collapsed && <span>Ledger Watch</span>}
          </div>
          <Hint label={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right"><button onClick={toggle} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} className="grid h-7 w-7 place-items-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground">
            <Toggle className="h-4 w-4" />
          </button></Hint>
        </div>
        {!collapsed && <p className="mb-2 px-3 text-xs font-medium text-muted-foreground">Workspace</p>}
        <nav className="flex flex-col gap-1">
          {nav.map(({ to, label, icon: Icon, exact }) => (
            <Hint key={to} label={collapsed ? label : undefined} side="right"><Link to={to} aria-label={label}
              className={`flex items-center gap-3 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${collapsed ? "justify-center px-0" : "px-3"}`}
              activeProps={{ className: "bg-secondary !text-foreground" }} activeOptions={{ exact, includeSearch: false }}>
              <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
            </Link></Hint>
          ))}
        </nav>
        <div className={`mt-auto flex flex-col gap-2 border-t border-border pt-4 ${collapsed ? "items-center" : ""}`}>
          <Hint label={collapsed ? "Reset demo" : undefined} side="right"><button onClick={() => { dispatch({ type: "reset" }); toast.success("Demo data reset", { duration: 2500 }); }} aria-label="Reset demo"
            className={`flex items-center gap-3 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${collapsed ? "justify-center px-2" : "px-3"}`}>
            <Restore className="h-4 w-4 shrink-0" />{!collapsed && <span>Reset demo</span>}
          </button></Hint>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
            <Avatar name="Neha Hiremath" label={collapsed ? "Neha Hiremath" : undefined} />
            {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">Neha Hiremath</p><p className="truncate text-xs text-muted-foreground">Finance lead</p></div>}
          </div>
        </div>
      </aside>
      <main className={canvas ? "flex min-h-0 min-w-0 flex-1 flex-col" : "min-w-0 flex-1 px-6 py-10 lg:px-12 max-sm:px-4"}>{children}</main>
    </div>
  );
}
