import { describe, expect, it } from "vitest";
import { getRunDetail } from "@/lib/mock-runs";
import { runs } from "@/lib/mock-data";
import { advanceReplay, hasNewReceipt, nodeOutcome, startSavedReplay } from "@/lib/replay-flow";
import { initialPrototypeState, prototypeReducer } from "@/lib/prototype-state";

describe("Run-specific mock records", () => {
  it.each(runs)("resolves $id to its own agents, amount and vendor", (row) => {
    const run = getRunDetail(row.id);
    expect(run?.id).toBe(row.id);
    expect(run?.agents).toHaveLength(4);
    expect(run?.agents[0]?.evidence).toContainEqual({ label: "Invoice number", value: row.id });
    expect(run?.agents[3]?.evidence).toContainEqual({ label: "Amount paid", value: row.amount === "$12,480" && row.id === "INV-4821-A" ? "$12,480.00" : row.amount });
    expect(run?.agents[3]?.evidence).toContainEqual({ label: "Payee", value: row.vendor });
  });
  it.each(["INV-4821", "INV-4790", "INV-4766"])("keeps %s completed under the saved combined rule without a new receipt", (id) => {
    const run = getRunDetail(id);
    expect(run?.duplicate).toBe(false);
    expect(run?.queue).toEqual([]);
    const saved = prototypeReducer(initialPrototypeState, { type: "rule", rule: "combined", time: "09:14" });
    let replay = startSavedReplay(saved, run?.duplicate);
    const visited: number[] = [];
    while (replay.phase !== "complete") {
      if (replay.phase === "running") visited.push(replay.index);
      replay = advanceReplay(replay);
    }
    expect(visited).toEqual([0, 1, 2, 3]);
    expect([0, 1, 2, 3].map(index => nodeOutcome(index, replay))).toEqual(["success", "success", "success", "success"]);
    expect(hasNewReceipt(replay)).toBe(false);
  });
  it("retains the duplicate Matching evidence and confidence", () => {
    const run = getRunDetail("INV-4821-A");
    expect(run?.duplicate).toBe(true);
    expect(run?.agents[1]?.confidence).toBe(62);
    expect(run?.agents[1]?.evidence).toContainEqual({ label: "Matched PO", value: "PO-7710" });
  });
  it("rejects unknown runs instead of displaying the duplicate canvas", () => {
    expect(getRunDetail("missing")).toBeUndefined();
    expect(getRunDetail("toString")).toBeUndefined();
  });
  it("records completed replay without logging a duplicate payment", () => {
    const state = prototypeReducer(initialPrototypeState, { type: "replay", caught: false, time: "09:14", completedRunId: "INV-4790" });
    expect(state.log[0]?.message).toBe("Replay completed for INV-4790, payment verified");
  });
});