import type { DuplicateRule, PrototypeState } from "@/lib/prototype-state";

export type NodeOutcome = "pending" | "running" | "success" | "warning" | "failed" | "skipped";
export interface ReplayFlow {
  rule: DuplicateRule;
  duplicate?: boolean;
  index: number;
  phase: "running" | "handoff" | "complete";
}
export function startReplay(rule: DuplicateRule): ReplayFlow {
  return { rule, index: 0, phase: "running" };
}
export function startSavedReplay(state: Pick<PrototypeState, "rule">, duplicate = true): ReplayFlow {
  return duplicate ? startReplay(state.rule) : { ...startReplay(state.rule), duplicate: false };
}

export function savedRuleView(replay: ReplayFlow | null, rule: DuplicateRule): ReplayFlow | null {
  if (replay?.duplicate === false) return replay;
  if (replay?.rule === rule) return replay;
  return rule === "combined" ? { rule, index: 2, phase: "complete" } : null;
}

export function completionAgents(replay: ReplayFlow): number[] {
  if (replay.phase !== "running") return [];
  if (replay.index === 2) return [];
  return replay.index === 3 ? [2, 3] : [replay.index];
}
export function advanceReplay(replay: ReplayFlow): ReplayFlow {
  if (replay.phase === "complete") return replay;
  if (replay.phase === "running") {
    if (replay.duplicate !== false && replay.rule === "combined" && replay.index === 2) return { ...replay, phase: "complete" };
    return { ...replay, phase: "handoff" };
  }
  if (replay.index === 3) return { ...replay, phase: "complete" };
  return { ...replay, index: replay.index + 1, phase: "running" };
}
export function nodeOutcome(index: number, replay: ReplayFlow | null): NodeOutcome {
  if (!replay) return index === 1 ? "warning" : "success";
  if (replay.duplicate !== false && replay.phase === "complete" && replay.rule === "combined" && index === 3) return "skipped";
  if (index > replay.index) return "pending";
  if (index === replay.index && replay.phase === "running") return "running";
  if (index === 1 && replay.duplicate !== false) return "warning";
  if (index === 2 && replay.rule === "combined" && replay.duplicate !== false) return "failed";
  return "success";
}

export function handoffOutcome(index: number, replay: ReplayFlow | null): NodeOutcome {
  const outcome = nodeOutcome(index, replay);
  if (index === 1 && replay?.duplicate !== false && replay?.rule === "combined" && outcome === "warning") return "failed";
  return outcome;
}

export function hasNewReceipt(replay: ReplayFlow | null): boolean {
  return replay?.duplicate !== false && replay?.phase === "complete" && replay.rule === "exact";
}