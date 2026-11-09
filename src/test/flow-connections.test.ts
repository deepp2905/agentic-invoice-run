import { describe, expect, it } from "vitest";
import { connectionSides } from "@/lib/flow-connections";

const card = { x: 0, y: 0, width: 230, height: 240 };
describe("Facing connection edges", () => {
  it("connects a card on the right to the next card's left center", () => {
    expect(connectionSides(card, { ...card, x: 320 })).toEqual({ source: "right", target: "left" });
  });
  it("originates at the left edge when the next card is to the left", () => {
    expect(connectionSides({ ...card, x: 320 }, card)).toEqual({ source: "left", target: "right" });
  });
  it("uses bottom to top for a card below", () => {
    expect(connectionSides(card, { ...card, y: 350 })).toEqual({ source: "bottom", target: "top" });
  });
  it("uses top to bottom for a card above", () => {
    expect(connectionSides({ ...card, y: 350 }, card)).toEqual({ source: "top", target: "bottom" });
  });
  it("keeps a gently staggered row horizontally connected", () => {
    expect(connectionSides(card, { ...card, x: 310, y: 28 })).toEqual({ source: "right", target: "left" });
  });
});