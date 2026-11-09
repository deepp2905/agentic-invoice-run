export type ConnectionSide = "left" | "right" | "top" | "bottom";
type CardBounds = { x: number; y: number; width: number; height: number };

// Pick facing edge centers from the cards' current bounds, not their sequence.
export function connectionSides(source: CardBounds, target: CardBounds): { source: ConnectionSide; target: ConnectionSide } {
  const dx = target.x + target.width / 2 - source.x - source.width / 2;
  const dy = target.y + target.height / 2 - source.y - source.height / 2;
  if (Math.abs(dx) / ((source.width + target.width) / 2) >= Math.abs(dy) / ((source.height + target.height) / 2)) {
    return dx >= 0 ? { source: "right", target: "left" } : { source: "left", target: "right" };
  }
  return dy >= 0 ? { source: "bottom", target: "top" } : { source: "top", target: "bottom" };
}