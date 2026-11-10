export type DuplicateRule = "exact" | "combined";
export type RuleId = "duplicate" | "confidence" | "limit" | "late";
export type ActionKind = "pause" | "rule" | "toggle" | "replay" | "undo";
export type LogCategory = "runs" | "rules";
export interface LogEntry {
  id: number;
  kind: ActionKind;
  category: LogCategory;
  message: string;
  time: string;
  previousRule?: DuplicateRule;
  ruleId?: RuleId;
  previousEnabled?: boolean;
  affects?: string;
  at?: number | undefined;
  undone?: boolean;
}
export interface PrototypeState {
  paused: boolean;
  rule: DuplicateRule;
  ruleEnabled: Record<RuleId, boolean>;
  heldDuplicate: boolean;
  log: LogEntry[];
  nextId: number;
  lastSeenLogId: number;
}
export type PrototypeAction =
  | { type: "pause"; time: string }
  | { type: "rule"; rule: DuplicateRule; time: string }
  | { type: "toggle"; rule: RuleId; time: string; at?: number }
  | { type: "replay"; caught: boolean; time: string; completedRunId?: string }
  | { type: "undo"; id: number; time: string }
  | { type: "reset" }
  | { type: "seen" };

export const ruleNames: Record<RuleId, string> = {
  duplicate: "Duplicate check",
  confidence: "Match confidence threshold",
  limit: "Vendor approval limit",
  late: "Late payment alert",
};

export const initialPrototypeState: PrototypeState = {
  paused: false,
  rule: "exact",
  ruleEnabled: { duplicate: true, confidence: true, limit: true, late: true },
  heldDuplicate: false,
  log: [],
  nextId: 1,
  lastSeenLogId: 0,
};

export const queuedInvoices = [
  { id: "INV-4821-B", vendor: "Harbor Office Supply", amount: "$12,480", po: "PO-7710", legit: false },
  { id: "INV-4821-C", vendor: "Harbor Office Supply", amount: "$12,480", po: "PO-7710", legit: false },
  { id: "INV-4821-D", vendor: "Harbor Office Supply", amount: "$3,150", po: "PO-7742", legit: true },
];
export function queuedInvoiceState(invoice: { legit: boolean }, paused: boolean): "safe" | "paused" | "queued" {
  return invoice.legit ? "safe" : paused ? "paused" : "queued";
}
export function replayOutcome(rule: DuplicateRule) {
  return { caught: rule === "combined", payment: rule === "combined" ? "held" : "paid" } as const;
}

export type RunStatus = "paid-twice" | "held" | "paused" | "safe" | "queued" | "ok";
export const runStatusMeta: Record<RunStatus, { label: string; tone: "destructive" | "success" | "warning" | "neutral" }> = {
  "paid-twice": { label: "Paid twice", tone: "destructive" },
  held: { label: "Held, duplicate caught", tone: "success" },
  paused: { label: "Paused", tone: "warning" },
  safe: { label: "Safe to release", tone: "success" },
  queued: { label: "Queued", tone: "neutral" },
  ok: { label: "OK", tone: "neutral" },
};
/** The rule replay actually applies: a switched-off duplicate check protects nothing. */
export function effectiveRule(state: Pick<PrototypeState, "rule"> & { ruleEnabled?: Record<RuleId, boolean> }): DuplicateRule {
  return state.ruleEnabled && !state.ruleEnabled.duplicate ? "exact" : state.rule;
}
export const toggleGroupWindowMs = 10_000;
export function runStatus(runId: string, state: Pick<PrototypeState, "paused" | "heldDuplicate"> & { ruleEnabled?: Record<RuleId, boolean> }): RunStatus {
  if (runId === "INV-4821-A") return state.heldDuplicate && state.ruleEnabled?.duplicate !== false ? "held" : "paid-twice";
  const invoice = queuedInvoices.find((item) => item.id === runId);
  if (invoice) return invoice.legit ? "safe" : state.paused ? "paused" : "queued";
  return "ok";
}

export function prototypeReducer(state: PrototypeState, action: PrototypeAction): PrototypeState {
  if (action.type === "reset") return initialPrototypeState;
  if (action.type === "seen") return state.lastSeenLogId === state.nextId - 1 ? state : { ...state, lastSeenLogId: state.nextId - 1 };
  let update: Partial<PrototypeState> = {};
  let entry: Omit<LogEntry, "id" | "time">;
  if (action.type === "pause") {
    if (state.paused) return state;
    update = { paused: true };
    entry = { kind: "pause", category: "runs", message: "You paused 2 queued runs", affects: "2 runs held" };
  } else if (action.type === "rule") {
    if (state.rule === action.rule) return state;
    // Restoring the old rule must be an explicit, recorded Activity undo.
    if (state.rule === "combined" && action.rule === "exact") return state;
    update = { rule: action.rule };
    entry = { kind: "rule", category: "rules", message: "You changed duplicate rule to vendor + amount + PO", previousRule: state.rule, affects: "Affects future runs" };
  } else if (action.type === "toggle") {
    const enabled = !state.ruleEnabled[action.rule];
    const ruleEnabled = { ...state.ruleEnabled, [action.rule]: enabled };
    const message = `You turned ${enabled ? "on" : "off"} ${ruleNames[action.rule]}`;
    const affects = action.rule === "duplicate" && !enabled ? "Affects future runs · Duplicates not blocked" : "Affects future runs";
    const last = state.log[0];
    // Rapid flips of one rule collapse into a single entry showing the final state.
    if (last && last.kind === "toggle" && last.ruleId === action.rule && !last.undone && action.at !== undefined && last.at !== undefined && action.at - last.at <= toggleGroupWindowMs) {
      return { ...state, ruleEnabled, log: [{ ...last, message, affects, time: action.time, at: action.at }, ...state.log.slice(1)] };
    }
    update = { ruleEnabled };
    entry = { kind: "toggle", category: "rules", ruleId: action.rule, previousEnabled: state.ruleEnabled[action.rule], message, affects, at: action.at };
  } else if (action.type === "replay") {
    if (action.caught) update = { heldDuplicate: true };
    entry = { kind: "replay", category: "runs", message: action.completedRunId ? `Replay completed for ${action.completedRunId}, payment verified` : action.caught ? "Replay completed, duplicate caught" : "Replay completed, invoice paid again", affects: action.completedRunId ? `${action.completedRunId} verified` : action.caught ? "INV-4821-A held, not paid" : "INV-4821-A paid again" };
  } else {
    const target = state.log.find((item) => item.id === action.id);
    if (!target || target.undone || !isUndoable(target)) return state;
    // Undo the most recent active change of each kind, preserving a reversible history.
    const latest = state.log.find((item) => item.kind === target.kind && !item.undone && (target.kind !== "toggle" || item.ruleId === target.ruleId));
    if (latest?.id !== target.id) return state;
    if (target.kind === "pause") update = { paused: false };
    else if (target.kind === "rule") update = { rule: target.previousRule ?? "exact", heldDuplicate: false };
    else if (target.ruleId) update = { ruleEnabled: { ...state.ruleEnabled, [target.ruleId]: target.previousEnabled ?? !state.ruleEnabled[target.ruleId] } };
    // Undo marks the original entry instead of adding a new one.
    return { ...state, ...update, log: state.log.map((item) => item.id === target.id ? { ...item, undone: true } : item) };
  }
  return { ...state, ...update, nextId: state.nextId + 1, log: [{ ...entry, id: state.nextId, time: action.time }, ...state.log] };
}
export function isUndoable(entry: LogEntry) {
  return entry.kind === "pause" || entry.kind === "rule" || entry.kind === "toggle";
}
