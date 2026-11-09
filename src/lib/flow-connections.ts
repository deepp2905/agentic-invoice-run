export type ConnectionSide = "left" | "right" | "top" | "bottom";
type CardBounds = { x: number; y: number; width: number; height: number };
type Connection = { source: ConnectionSide; target: ConnectionSide };

// Pick facing edge centers from the cards' current bounds, not their sequence.
export function connectionSides(source: CardBounds, target: CardBounds): { source: ConnectionSide; target: ConnectionSide } {
  const dx = target.x + target.width / 2 - source.x - source.width / 2;
  const dy = target.y + target.height / 2 - source.y - source.height / 2;
  if (Math.abs(dx) / ((source.width + target.width) / 2) >= Math.abs(dy) / ((source.height + target.height) / 2)) {
    return dx >= 0 ? { source: "right", target: "left" } : { source: "left", target: "right" };
  }
  return dy >= 0 ? { source: "bottom", target: "top" } : { source: "top", target: "bottom" };
}

const sides: ConnectionSide[] = ["right", "bottom", "left", "top"];
function facingScores(card: CardBounds, neighbor: CardBounds): Record<ConnectionSide, number> {
  const dx = (neighbor.x + neighbor.width / 2 - card.x - card.width / 2) / ((card.width + neighbor.width) / 2);
  const dy = (neighbor.y + neighbor.height / 2 - card.y - card.height / 2) / ((card.height + neighbor.height) / 2);
  const length = Math.hypot(dx, dy) || 1;
  return { right: dx / length, left: -dx / length, bottom: dy / length, top: -dy / length };
}

// Jointly choose both ports on each card: neither can occupy the other's point.
export function flowConnections(cards: CardBounds[]): Connection[] {
  const connections = cards.slice(0, -1).map((source, i) => connectionSides(source, cards[i + 1] ?? source));
  for (let i = 1; i < cards.length - 1; i++) {
    const card = cards[i];
    const previous = cards[i - 1];
    const next = cards[i + 1];
    const incoming = connections[i - 1];
    const outgoing = connections[i];
    if (!card || !previous || !next || !incoming || !outgoing || incoming.target !== outgoing.source) continue;
    const entryScores = facingScores(card, previous);
    const exitScores = facingScores(card, next);
    let bestScore = -Infinity;
    let entry = incoming.target;
    let exit = outgoing.source;
    // Prefer preserving the direct exit when two routings are equally good.
    for (const candidateExit of [outgoing.source, ...sides.filter(side => side !== outgoing.source)]) {
      for (const candidateEntry of sides) {
        if (candidateEntry === candidateExit) continue;
        const score = entryScores[candidateEntry] + exitScores[candidateExit];
        if (score > bestScore + 1e-9) {
          bestScore = score;
          entry = candidateEntry;
          exit = candidateExit;
        }
      }
    }
    incoming.target = entry;
    outgoing.source = exit;
  }
  return connections;
}