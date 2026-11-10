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
  undone?: boolean;
}
export interface PrototypeState {
  paused: boolean;
  rule: DuplicateRule;
  ruleEnabled: Record<RuleId, boolean>;
  heldDuplicate: boolean;
  log: LogEntry[];
  nextId: number;
}
export type PrototypeAction =
  | { type: "pause"; time: string }
  | { type: "rule"; rule: DuplicateRule; time: string }
  | { type: "toggle"; rule: RuleId; time: string }
  | { type: "replay"; caught: boolean; time: string; completedRunId?: string }
  | { type: "undo"; id: number; time: string }
  | { type: "reset" };

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
export function runStatus(runId: string, state: Pick<PrototypeState, "paused" | "heldDuplicate">): RunStatus {
  if (runId === "INV-4821-A") return state.heldDuplicate ? "held" : "paid-twice";
  const invoice = queuedInvoices.find((item) => item.id === runId);
  if (invoice) return invoice.legit ? "safe" : state.paused ? "paused" : "queued";
  return "ok";
}

export function prototypeReducer(state: PrototypeState, action: PrototypeAction): PrototypeState {
  if (action.type === "reset") return initialPrototypeState;
  let update: Partial<PrototypeState> = {};
  let entry: Omit<LogEntry, "id" | "time">;
  if (action.type === "pause") {
    if (state.paused) return state;
    update = { paused: true };
    entry = { kind: "pause", category: "runs", message: "Finance lead paused 2 queued runs" };
  } else if (action.type === "rule") {
    if (state.rule === action.rule) return state;
    // Restoring the old rule must be an explicit, recorded Activity undo.
    if (state.rule === "combined" && action.rule === "exact") return state;
    update = { rule: action.rule };
    entry = { kind: "rule", category: "rules", message: "Finance lead changed duplicate rule", previousRule: state.rule };
  } else if (action.type === "toggle") {
    const enabled = !state.ruleEnabled[action.rule];
    update = { ruleEnabled: { ...state.ruleEnabled, [action.rule]: enabled } };
    entry = { kind: "toggle", category: "rules", ruleId: action.rule, message: `Finance lead turned ${enabled ? "on" : "off"} ${ruleNames[action.rule]}` };
  } else if (action.type === "replay") {
    if (action.caught) update = { heldDuplicate: true };
    entry = { kind: "replay", category: "runs", message: action.completedRunId ? `Replay completed for ${action.completedRunId}, payment verified` : action.caught ? "Replay completed, duplicate caught" : "Replay completed, invoice paid again" };
  } else {
    const target = state.log.find((item) => item.id === action.id);
    if (!target || target.undone || (target.kind !== "pause" && target.kind !== "rule" && target.kind !== "toggle")) return state;
    // Undo the most recent active change of each kind, preserving a reversible history.
    const latest = state.log.find((item) => item.kind === target.kind && !item.undone && (target.kind !== "toggle" || item.ruleId === target.ruleId));
    if (latest?.id !== target.id) return state;
    if (target.kind === "pause") update = { paused: false };
    else if (target.kind === "rule") update = { rule: target.previousRule ?? "exact", heldDuplicate: false };
    else if (target.ruleId) update = { ruleEnabled: { ...state.ruleEnabled, [target.ruleId]: !state.ruleEnabled[target.ruleId] } };
    update.log = state.log.map((item) => item.id === target.id ? { ...item, undone: true } : item);
    entry = { kind: "undo", category: target.category, message: target.kind === "pause" ? "Finance lead resumed 2 queued runs" : target.kind === "rule" ? "Finance lead restored duplicate rule" : `Finance lead restored ${ruleNames[target.ruleId ?? "duplicate"]}` };
  }
  return { ...state, ...update, nextId: state.nextId + 1, log: [{ ...entry, id: state.nextId, time: action.time }, ...(update.log ?? state.log)] };
}
