import { describe, expect, it } from "vitest";
import { resolveOverlap } from "@/lib/node-collision";

const box = { x: 0, y: 0, width: 230, height: 240 };
const overlaps = (a: typeof box, b: typeof box) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe("Node collision", () => {
  it("pushes a dropped node off another node", () => {
    const p = resolveOverlap({ ...box, x: 150, y: 20 }, [box]);
    expect(overlaps({ ...box, ...p }, box)).toBe(false);
  });
  it("leaves non-overlapping nodes alone", () => {
    expect(resolveOverlap({ ...box, x: 400 }, [box])).toEqual({ x: 400, y: 0 });
  });
});
