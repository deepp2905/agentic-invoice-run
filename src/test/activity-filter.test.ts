import { describe, expect, it } from "vitest";
import { activityHistory, filterActivity } from "@/lib/mock-activity";
import { initialPrototypeState, prototypeReducer } from "@/lib/prototype-state";

describe("Activity filters", () => {
  const paused = prototypeReducer(initialPrototypeState, { type: "pause", time: "a" });
  const state = prototypeReducer(paused, { type: "rule", rule: "combined", time: "b" });
  it("All includes every historical entry and every current user action", () => {
    expect(filterActivity(activityHistory, "all")).toHaveLength(7);
    expect(filterActivity(state.log, "all").map(entry => entry.id)).toEqual([2, 1]);
  });
  it("Rules includes only rule history and rule actions", () => {
    expect(filterActivity(activityHistory, "rules").map(entry => entry.id)).toEqual(["h6", "h7"]);
    expect(filterActivity(state.log, "rules").map(entry => entry.id)).toEqual([2]);
  });
  it("Runs includes only run history and run actions", () => {
    expect(filterActivity(activityHistory, "runs").map(entry => entry.id)).toEqual(["h1", "h2", "h3", "h5", "h4"]);
    expect(filterActivity(state.log, "runs").map(entry => entry.id)).toEqual([1]);
  });
});