export type DuplicateRule = "exact" | "combined";
export type ActionKind = "pause" | "rule" | "replay" | "undo";
export interface LogEntry {
  id: number;
  kind: ActionKind;
  message: string;
  time: string;
  previousRule?: DuplicateRule;
  undone?: boolean;
}
export interface PrototypeState {
  paused: boolean;
  rule: DuplicateRule;
  log: LogEntry[];
  nextId: number;
}
export type PrototypeAction =
  | { type: "pause"; time: string }
  | { type: "rule"; rule: DuplicateRule; time: string }
  | { type: "replay"; caught: boolean; time: string }
  | { type: "undo"; id: number; time: string };
export const initialPrototypeState: PrototypeState = { paused: false, rule: "exact", log: [], nextId: 1 };
export const queuedInvoices = [
  { id: "INV-4821-B", vendor: "Harbor Office Supply", amount: "$12,480", po: "PO-7710", legit: false },
  { id: "INV-4821-C", vendor: "Harbor Office Supply", amount: "$12,480", po: "PO-7710", legit: false },
  { id: "INV-4821-D", vendor: "Harbor Office Supply", amount: "$3,150", po: "PO-7742", legit: true },
];
export function replayOutcome(rule: DuplicateRule) {
  return { caught: rule === "combined", payment: rule === "combined" ? "held" : "paid" } as const;
}
export function prototypeReducer(state: PrototypeState, action: PrototypeAction): PrototypeState {
  let update: Partial<PrototypeState> = {};
  let entry: Omit<LogEntry, "id" | "time">;
  if (action.type === "pause") {
    if (state.paused) return state;
    update = { paused: true };
    entry = { kind: "pause", message: "Finance lead paused 3 queued runs" };
  } else if (action.type === "rule") {
    if (state.rule === action.rule) return state;
    update = { rule: action.rule };
    entry = { kind: "rule", message: "Finance lead changed duplicate rule", previousRule: state.rule };
  } else if (action.type === "replay") {
    entry = { kind: "replay", message: action.caught ? "Replay completed, duplicate caught" : "Replay completed, invoice paid again" };
  } else {
    const target = state.log.find((item) => item.id === action.id);
    if (!target || target.undone || (target.kind !== "pause" && target.kind !== "rule")) return state;
    // Undo the most recent active change of each kind, preserving a reversible history.
    const latest = state.log.find((item) => item.kind === target.kind && !item.undone);
    if (latest?.id !== target.id) return state;
    update = target.kind === "pause" ? { paused: false } : { rule: target.previousRule ?? "exact" };
    update.log = state.log.map((item) => item.id === target.id ? { ...item, undone: true } : item);
    entry = { kind: "undo", message: target.kind === "pause" ? "Finance lead resumed 3 queued runs" : "Finance lead restored duplicate rule" };
  }
  return { ...state, ...update, nextId: state.nextId + 1, log: [{ ...entry, id: state.nextId, time: action.time }, ...(update.log ?? state.log)] };
}