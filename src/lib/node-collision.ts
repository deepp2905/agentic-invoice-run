export type Box = { x: number; y: number; width: number; height: number };

// Push a moved box out of any overlap using the smallest separating translation.
export function resolveOverlap(moved: Box, others: Box[], gap = 24): { x: number; y: number } {
  let { x, y } = moved;
  for (let pass = 0; pass < 8; pass++) {
    let changed = false;
    for (const o of others) {
      const overlapX = Math.min(x + moved.width + gap, o.x + o.width + gap) - Math.max(x, o.x);
      const overlapY = Math.min(y + moved.height + gap, o.y + o.height + gap) - Math.max(y, o.y);
      if (overlapX <= 0 || overlapY <= 0) continue;
      const cx = x + moved.width / 2 - (o.x + o.width / 2);
      const cy = y + moved.height / 2 - (o.y + o.height / 2);
      if (overlapX < overlapY) x += cx >= 0 ? overlapX : -overlapX;
      else y += cy >= 0 ? overlapY : -overlapY;
      changed = true;
    }
    if (!changed) break;
  }
  return { x, y };
}
