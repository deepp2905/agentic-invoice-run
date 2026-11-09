import type { ReactElement } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Themed replacement for native title tooltips.
export function Hint({ label, side, children }: { label?: string | undefined; side?: "top" | "right" | "bottom" | "left" | undefined; children: ReactElement }) {
  if (!label) return children;
  return <TooltipProvider delayDuration={250}>
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side ?? "top"} className="rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-none">{label}</TooltipContent>
    </Tooltip>
  </TooltipProvider>;
}
