import { describe, expect, it } from "vitest";
import { advanceReplay, completionAgents, handoffOutcome, hasNewReceipt, nodeOutcome, savedRuleView, startReplay, startSavedReplay } from "@/lib/replay-flow";
import { initialPrototypeState, prototypeReducer } from "@/lib/prototype-state";

describe("Investigation replay", () => {
  it("reads the saved rule for every replay, retaining held state until Activity undo", () => {
    const saved = prototypeReducer(initialPrototypeState, { type: "rule", rule: "combined", time: "09:14" });
    const replay = startSavedReplay(saved);
    expect(replay.rule).toBe("combined");
    expect(savedRuleView(null, saved.rule)).toEqual({ rule: "combined", index: 2, phase: "complete" });
    expect(savedRuleView({ rule: "exact", index: 3, phase: "complete" }, saved.rule)?.rule).toBe("combined");
    expect(startSavedReplay(prototypeReducer(saved, { type: "undo", id: 1, time: "09:15" })).rule).toBe("exact");
  });
  it("defers Policy completion until Issue payment finishes processing", () => {
    expect(completionAgents({ rule: "exact", index: 2, phase: "running" })).toEqual([]);
    expect(completionAgents({ rule: "exact", index: 3, phase: "handoff" })).toEqual([]);
    expect(completionAgents({ rule: "exact", index: 3, phase: "running" })).toEqual([2, 3]);
  });
  it("marks Matching's outgoing handoff failed after it flags the duplicate under the fixed rule", () => {
    let replay = startReplay("combined");
    replay = advanceReplay(advanceReplay(replay));
    expect(handoffOutcome(1, replay)).toBe("running");
    expect(handoffOutcome(1, advanceReplay(replay))).toBe("failed");
    expect(handoffOutcome(1, { rule: "exact", index: 1, phase: "handoff" })).toBe("warning");
  });
  it("never creates a new receipt when the fixed rule holds payment", () => {
    let replay = startReplay("combined");
    while (replay.phase !== "complete") {
      expect(hasNewReceipt(replay)).toBe(false);
      replay = advanceReplay(replay);
    }
    expect(hasNewReceipt(replay)).toBe(false);
    expect(hasNewReceipt({ rule: "exact", index: 3, phase: "complete" })).toBe(true);
  });
  it("runs only the current agent and leaves future agents pending", () => {
    const replay = startReplay("exact");
    expect([0, 1, 2, 3].map(i => nodeOutcome(i, replay))).toEqual(["running", "pending", "pending", "pending"]);
  });
  it("completes an agent before handing off, then starts the next", () => {
    const handoff = advanceReplay(startReplay("exact"));
    expect(handoff).toMatchObject({ index: 0, phase: "handoff" });
    expect(nodeOutcome(0, handoff)).toBe("success");
    expect(nodeOutcome(1, handoff)).toBe("pending");
    expect(advanceReplay(handoff)).toMatchObject({ index: 1, phase: "running" });
  });
  it("stops at Policy when held and never runs Payment", () => {
    let replay = startReplay("combined");
    const visited = [replay.index];
    for (let i = 0; i < 10 && replay.phase !== "complete"; i++) {
      replay = advanceReplay(replay);
      if (replay.phase === "running") visited.push(replay.index);
    }
    expect(visited).toEqual([0, 1, 2]);
    expect(replay).toMatchObject({ index: 2, phase: "complete" });
    expect(nodeOutcome(2, replay)).toBe("failed");
    expect(nodeOutcome(3, replay)).toBe("skipped");
  });
  it("runs Payment and hands off to the tray under the exact-number rule", () => {
    let replay = startReplay("exact");
    for (let i = 0; i < 7; i++) replay = advanceReplay(replay);
    expect(replay).toMatchObject({ index: 3, phase: "handoff" });
    expect(nodeOutcome(3, replay)).toBe("success");
    expect(advanceReplay(replay).phase).toBe("complete");
  });
});