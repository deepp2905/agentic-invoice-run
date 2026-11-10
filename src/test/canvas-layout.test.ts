import { describe, expect, it } from "vitest";
import { canvasLayout, clearLabelPosition, elbowHandoff, easeInOut } from "@/lib/canvas-layout";

describe("Run canvas layout", () => {
  it("leaves 8 screen pixels between a label and nearby node bounds", () => {
    const zoom = 0.7;
    const node = { x: 0, y: 0, width: 240, height: 140 };
    const position = clearLabelPosition(240, 100, 100, 50, [node], 8 / zoom);
    expect((position.y - node.height) * zoom).toBeCloseTo(8);
    expect(clearLabelPosition(350, 180, 100, 50, [node], 8 / zoom)).toEqual({ x: 350, y: 180 });
  });
  it("orders both rows left to right", () => {
    expect(canvasLayout.positions.map(p => p.x)).toEqual([0, 350, 900, 0, 350, 700]);
    expect(canvasLayout.positions.map(p => p.y)).toEqual([0, 0, 0, 380, 380, 380]);
  });
  it("keeps minimum zoom at 70% and full-flow padding at 48px", () => {
    expect(canvasLayout.minimumZoom).toBe(0.7);
    expect(canvasLayout.padding).toBe(48);
  });
  it("waits 0.4s then focuses at 100% over 0.8s while the count runs for 0.6s", () => {
    expect([canvasLayout.previewDuration, canvasLayout.cameraDuration, canvasLayout.countDuration, canvasLayout.focusZoom]).toEqual([0, 800, 600, 1]);
    expect(canvasLayout.dimmedOpacity).toBe(0.4);
  });
  it("routes the Matching handoff in the empty lane between rows", () => {
    expect(elbowHandoff(868, 262, 120, 380)).toEqual({ path: "M 868,262 C 868,321 868,321 494,321 C 120,321 120,321 120,370", labelX: 494, labelY: 299 });
  });
  it("uses an eased camera interpolation with exact endpoints", () => {
    expect([0, 0.25, 0.5, 0.75, 1].map(easeInOut)).toEqual([0, 0.125, 0.5, 0.875, 1]);
  });
});
import { replayViewport } from "@/lib/canvas-layout";
describe("Replay fit", () => {
  it("never exceeds 85% zoom", () => {
    expect(replayViewport({ x: 0, y: 0, width: 100, height: 100 }, 2000, 2000).zoom).toBe(0.85);
  });
  it("keeps 32px sides and 80px empty space below the lowest node", () => {
    const b = { x: 0, y: 0, width: 1000, height: 600 };
    const v = replayViewport(b, 64 + 1000 * 0.6, 2000);
    expect(v.x).toBeCloseTo(32);
    const tall = replayViewport(b, 4000, 600 * 0.5 + 32 + 72 + 32 + 80);
    expect(tall.zoom).toBeCloseTo(0.5);
    expect(600 * 0.5 + 32 + 72 + 32 + 80 - (tall.y + 600 * tall.zoom)).toBeCloseTo(112);
  });
});
