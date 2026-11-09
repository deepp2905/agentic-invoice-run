import { describe, expect, it } from "vitest";
import { placeEdgeCaption } from "@/lib/edge-caption";

describe("Connector caption placement", () => {
  it("keeps a full caption 12 pixels below an unobstructed line", () => {
    expect(placeEdgeCaption({ x: 100, y: 50 }, { width: 100, height: 40 }, [], 1)).toEqual({ x: 100, y: 62, compact: false });
  });
  it("uses a compact marker instead of moving a caption away from a short connector", () => {
    const nodes = [{ x: 0, y: 0, width: 304, height: 100 }, { x: 350, y: 0, width: 304, height: 100 }];
    expect(placeEdgeCaption({ x: 327, y: 50 }, { width: 100, height: 40 }, nodes, 1)).toEqual({ x: 327, y: 62, compact: true });
  });
  it("avoids covering nodes when even a compact marker cannot fit", () => {
    expect(placeEdgeCaption({ x: 100, y: 50 }, { width: 100, height: 40 }, [{ x: 0, y: 0, width: 200, height: 150 }], 1)).toBeNull();
  });
});