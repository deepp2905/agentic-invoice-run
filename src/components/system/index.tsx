import type { ComponentType, ReactElement, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Button } from "@/components/ui/button";
import { Hint } from "@/components/Hint";
import { cn } from "@/lib/utils";

/* Atoms and molecules shared across pages. Every color, radius and size comes from tokens in styles.css. */

export type Tone = "neutral" | "success" | "warning" | "destructive";

export const toneText: Record<Tone, string> = {
  neutral: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  destructive: "text-destructive",
};

const chip = cva("inline-flex w-fit items-center whitespace-nowrap rounded-sm px-2 py-1 text-xs", {
  variants: { tone: { neutral: "bg-muted text-muted-foreground", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning", destructive: "bg-destructive/10 text-destructive" } },
  defaultVariants: { tone: "neutral" },
});
export function Chip({ tone, className, children }: VariantProps<typeof chip> & { className?: string; children: ReactNode }) {
  return <span className={cn(chip({ tone }), className)}>{children}</span>;
}

const notice = cva("flex items-start gap-3 rounded-lg text-sm", {
  variants: {
    tone: { neutral: "bg-muted text-foreground", success: "bg-success/10 text-success", warning: "bg-warning/10 text-warning", destructive: "bg-destructive/10 text-foreground" },
    size: { md: "px-4 py-3", lg: "px-6 py-5" },
  },
  defaultVariants: { tone: "neutral", size: "md" },
});
export function Notice({ tone, size, icon: Icon, action, className, children, role }: VariantProps<typeof notice> & { icon?: ComponentType<{ className?: string }>; action?: ReactNode; className?: string; children: ReactNode; role?: string }) {
  return <div role={role} className={cn(notice({ tone, size }), action && "flex-wrap items-center justify-between gap-6", className)}>
    <div className="flex items-start gap-3">
      {Icon && <Icon className={cn("mt-0.5 size-4 shrink-0", toneText[tone ?? "neutral"])} />}
      <div>{children}</div>
    </div>
    {action}
  </div>;
}

export function InsetRow({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-md bg-muted/50 px-2.5 py-2", className)}>{children}</div>;
}

export function Surface({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("rounded-lg border border-border bg-card", className)}>{children}</div>;
}

export function PageTitle({ children }: { children: ReactNode }) {
  return <h1 className="mb-6 text-2xl font-semibold">{children}</h1>;
}

export function SectionLabel({ className, children }: { className?: string; children: ReactNode }) {
  return <h3 className={cn("text-xs font-medium text-muted-foreground", className)}>{children}</h3>;
}

export function Field({ label, children, tone }: { label: string; children: ReactNode; tone?: Tone }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className={cn("mt-1 text-sm", tone && tone !== "neutral" && toneText[tone])}>{children}</p></div>;
}

export function IconButton({ label, icon: Icon, onClick, side }: { label: string; icon: ComponentType; onClick: () => void; side?: "top" | "right" | "bottom" | "left" | undefined }) {
  return <Hint label={label} side={side}><Button variant="ghost" size="icon" aria-label={label} onClick={onClick}><Icon /></Button></Hint>;
}

export function Avatar({ name, label }: { name: string; label?: string | undefined }): ReactElement {
  return <Hint label={label} side="right"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">{name.charAt(0)}</span></Hint>;
}
