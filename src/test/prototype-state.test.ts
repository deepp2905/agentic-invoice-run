import { describe, expect, it } from "vitest";
import { initialPrototypeState, prototypeReducer, queuedInvoices, replayOutcome } from "@/lib/prototype-state";

describe("Finance prototype actions", () => {
  it("pauses exactly 3 queued invoices and logs the action", () => {
    expect(queuedInvoices).toHaveLength(3);
    const state = prototypeReducer(initialPrototypeState, { type: "pause", time: "09:14" });
    expect(state.paused).toBe(true);
    expect(state.log[0]).toMatchObject({ kind: "pause", time: "09:14" });
  });
  it("undo resumes paused invoices", () => {
    const paused = prototypeReducer(initialPrototypeState, { type: "pause", time: "09:14" });
    const undone = prototypeReducer(paused, { type: "undo", id: 1, time: "09:15" });
    expect(undone.paused).toBe(false);
    expect(undone.log.find((entry) => entry.id === 1)?.undone).toBe(true);
  });
  it("saving changes the duplicate check to vendor + amount + PO", () => {
    const state = prototypeReducer(initialPrototypeState, { type: "rule", rule: "combined", time: "09:14" });
    expect(state.rule).toBe("combined");
    expect(state.log[0]?.kind).toBe("rule");
  });
  it("undo restores the prior duplicate rule", () => {
    const changed = prototypeReducer(initialPrototypeState, { type: "rule", rule: "combined", time: "09:14" });
    expect(prototypeReducer(changed, { type: "undo", id: 1, time: "09:15" }).rule).toBe("exact");
  });
  it("the unchanged exact-number rule replays as paid", () => {
    expect(replayOutcome("exact")).toEqual({ caught: false, payment: "paid" });
  });
  it("the combined rule catches the duplicate and holds payment", () => {
    expect(replayOutcome("combined")).toEqual({ caught: true, payment: "held" });
  });
  it("replay completion adds an activity entry without changing pause or rule state", () => {
    const state = prototypeReducer(initialPrototypeState, { type: "replay", caught: true, time: "09:15" });
    expect(state.log[0]?.kind).toBe("replay");
    expect(state.rule).toBe("exact");
    expect(state.paused).toBe(false);
  });
});