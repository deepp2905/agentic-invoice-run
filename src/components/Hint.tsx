import type { ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Themed replacement for native title tooltips.
export function Hint({ label, side = "top", children }: { label?: string | undefined; side?: "top" | "right" | "bottom" | "left"; children: ReactElement }) {
  if (!label) return children;
  return <TooltipProvider delayDuration={250}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side} className="rounded-md border border-border bg-popover px-2 py-1 font-mono text-2xs uppercase tracking-wider text-popover-foreground shadow-none">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}
