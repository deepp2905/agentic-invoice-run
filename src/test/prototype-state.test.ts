import { describe, expect, it } from "vitest";
import { initialPrototypeState, prototypeReducer, queuedInvoices, queuedInvoiceState, replayOutcome, runStatus } from "@/lib/prototype-state";

describe("Finance prototype actions", () => {
  it("pauses only INV-4821-B and INV-4821-C while D remains safe", () => {
    expect(queuedInvoices).toHaveLength(3);
    const state = prototypeReducer(initialPrototypeState, { type: "pause", time: "09:14" });
    expect(state.paused).toBe(true);
    expect(queuedInvoices.filter(invoice => queuedInvoiceState(invoice, state.paused) === "paused").map(invoice => invoice.id)).toEqual(["INV-4821-B", "INV-4821-C"]);
    expect(queuedInvoices.filter(invoice => queuedInvoiceState(invoice, state.paused) === "safe").map(invoice => invoice.id)).toEqual(["INV-4821-D"]);
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
  it("allows the saved combined rule to be restored only by Activity undo", () => {
    const saved = prototypeReducer(initialPrototypeState, { type: "rule", rule: "combined", time: "09:14" });
    expect(prototypeReducer(saved, { type: "rule", rule: "exact", time: "09:15" }).rule).toBe("combined");
    expect(prototypeReducer(saved, { type: "undo", id: 1, time: "09:16" }).rule).toBe("exact");
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
  it("toggles a rule off and restores it with undo", () => {
    const off = prototypeReducer(initialPrototypeState, { type: "toggle", rule: "limit", time: "09:14" });
    expect(off.ruleEnabled.limit).toBe(false);
    expect(off.log[0]).toMatchObject({ kind: "toggle", category: "rules", ruleId: "limit" });
    const undone = prototypeReducer(off, { type: "undo", id: 1, time: "09:15" });
    expect(undone.ruleEnabled.limit).toBe(true);
  });
  it("marks the duplicate run held after a catching replay and restores it on rule undo", () => {
    const ruled = prototypeReducer(initialPrototypeState, { type: "rule", rule: "combined", time: "09:14" });
    const replayed = prototypeReducer(ruled, { type: "replay", caught: true, time: "09:15" });
    expect(replayed.heldDuplicate).toBe(true);
    expect(runStatus("INV-4821-A", replayed)).toBe("held");
    const undone = prototypeReducer(replayed, { type: "undo", id: 1, time: "09:16" });
    expect(undone.heldDuplicate).toBe(false);
    expect(runStatus("INV-4821-A", undone)).toBe("paid-twice");
  });
  it("derives run statuses from shared state", () => {
    expect(runStatus("INV-4821-A", initialPrototypeState)).toBe("paid-twice");
    expect(runStatus("INV-4821-B", initialPrototypeState)).toBe("queued");
    const paused = prototypeReducer(initialPrototypeState, { type: "pause", time: "09:14" });
    expect(runStatus("INV-4821-B", paused)).toBe("paused");
    expect(runStatus("INV-4821-C", paused)).toBe("paused");
    expect(runStatus("INV-4821-D", paused)).toBe("safe");
    expect(runStatus("INV-4790", paused)).toBe("ok");
  });
  it("reset restores all starting data", () => {
    let state = prototypeReducer(initialPrototypeState, { type: "pause", time: "09:14" });
    state = prototypeReducer(state, { type: "rule", rule: "combined", time: "09:15" });
    state = prototypeReducer(state, { type: "toggle", rule: "late", time: "09:16" });
    expect(prototypeReducer(state, { type: "reset" })).toEqual(initialPrototypeState);
  });
});