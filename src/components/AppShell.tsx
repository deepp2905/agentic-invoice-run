import { Link } from "@tanstack/react-router";
import { IconActivity as Activity, IconShieldCheck as ShieldCheck, IconHistory as History, IconLayoutSidebarLeftCollapse as PanelLeftClose, IconLayoutSidebarLeftExpand as PanelLeftOpen, IconRestore as Restore, IconMenu2 as Menu } from "@tabler/icons-react";
import { Hint } from "@/components/Hint";
import { Avatar } from "@/components/system";
import { usePrototype } from "@/components/PrototypeProvider";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";

const nav = [
  { to: "/", label: "Runs", icon: Activity, exact: true },
  { to: "/rules", label: "Rules", icon: ShieldCheck, exact: false },
  { to: "/activity", label: "Activity", icon: History, exact: false },
] as const;

export function AppShell({ children, canvas = false }: { children: ReactNode; canvas?: boolean }) {
  const { state, dispatch } = usePrototype();
  const unread = state.log.filter((e) => e.id > state.lastSeenLogId).length;
  const [collapsed, setCollapsed] = useState(false);
  const [about, setAbout] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const toggle = () => setCollapsed(c => !c);
  const Toggle = collapsed ? PanelLeftOpen : PanelLeftClose;
  return (
    <div className={`flex w-full flex-col bg-background text-foreground md:flex-row ${canvas ? "h-dvh overflow-hidden" : "min-h-screen"}`}>
      <header className="grid shrink-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-sidebar px-4 py-3 md:hidden">
        <Link to="/" className="flex min-w-0 items-center gap-2 text-sm font-semibold"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">B</span>Backstop</Link>
        <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu /></Button>
      </header>
      <aside className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border bg-sidebar py-4 transition-[width] duration-200 md:flex ${collapsed ? "w-16 px-2" : "w-60 px-3"}`}>
        <div className={`mb-6 flex items-center ${collapsed ? "flex-col gap-3" : "justify-between px-2"}`}>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">B</span>
            {!collapsed && <span>Backstop</span>}
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
              <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span className="flex-1">{label}</span>}
              {!collapsed && to === "/activity" && unread > 0 && <span aria-label={`${unread} new`} className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-medium text-primary-foreground">{unread}</span>}
            </Link></Hint>
          ))}
        </nav>
        <div className={`mt-auto flex flex-col gap-2 border-t border-border pt-4 ${collapsed ? "items-center" : ""}`}>
          <Hint label={collapsed ? "Reset demo" : undefined} side="right"><button onClick={() => { dispatch({ type: "reset" }); toast.success("Demo data reset", { duration: 2500 }); }} aria-label="Reset demo"
            className={`flex items-center gap-3 rounded-md py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground ${collapsed ? "justify-center px-2" : "px-3"}`}>
            <Restore className="h-4 w-4 shrink-0" />{!collapsed && <span>Reset demo</span>}
          </button></Hint>
          <Button variant="ghost" size="sm" className="h-auto justify-start whitespace-normal px-3 text-xs text-muted-foreground" onClick={() => setAbout(true)}>About this prototype</Button>
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : "px-2"}`}>
            <Avatar name="Neha Hiremath" label={collapsed ? "Neha Hiremath" : undefined} />
            {!collapsed && <div className="min-w-0"><p className="truncate text-sm font-medium">Neha Hiremath</p><p className="truncate text-xs text-muted-foreground">Finance lead</p></div>}
          </div>
        </div>
      </aside>
      <main className={canvas ? "flex min-h-0 min-w-0 flex-1 flex-col max-md:overflow-y-auto" : "min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-10 lg:px-12"}>{children}</main>
      <Sheet open={mobileNav} onOpenChange={setMobileNav}>
        <SheetContent side="left" className="flex w-full max-w-xs flex-col bg-sidebar p-4">
          <SheetTitle className="flex items-center gap-2"><span className="grid h-7 w-7 shrink-0 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground">B</span>Backstop</SheetTitle>
          <SheetDescription className="sr-only">Workspace navigation</SheetDescription>
          <nav className="mt-6 flex flex-col gap-1">{nav.map(({ to, label, icon: Icon, exact }) => <Link key={to} to={to} onClick={() => setMobileNav(false)} className="flex min-w-0 items-center gap-3 rounded-md px-3 py-3 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground" activeProps={{ className: "bg-secondary !text-foreground" }} activeOptions={{ exact, includeSearch: false }}><Icon className="size-4 shrink-0" /><span className="flex-1">{label}</span>{to === "/activity" && unread > 0 && <span className="text-xs">{unread}</span>}</Link>)}</nav>
          <div className="mt-auto space-y-3 border-t border-border pt-4">
            <Button variant="ghost" className="w-full justify-start" onClick={() => { dispatch({ type: "reset" }); setMobileNav(false); toast.success("Demo data reset", { duration: 2500 }); }}><Restore />Reset demo</Button>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => { setMobileNav(false); setAbout(true); }}>About this prototype</Button>
            <div className="flex min-w-0 items-center gap-3"><Avatar name="Neha Hiremath" /><div className="min-w-0"><p className="truncate text-sm font-medium">Neha Hiremath</p><p className="text-xs text-muted-foreground">Finance lead</p></div></div>
          </div>
        </SheetContent>
      </Sheet>
      <Sheet open={about} onOpenChange={setAbout}>
        <SheetContent className="w-full overflow-y-auto bg-card p-6 sm:max-w-md sm:p-8" onAnimationEnd={event => event.stopPropagation()}>
          <SheetTitle>About this prototype</SheetTitle>
          <SheetDescription className="mt-6 space-y-4" asChild><div>
            <p>You are a finance lead.</p>
            <p>An AI agent paid an invoice twice.</p>
            <p>Data is simulated. Interactions are real.</p>
          </div></SheetDescription>
        </SheetContent>
      </Sheet>
    </div>
  );
}
