export const canvasLayout = {
  positions: [{ x: 0, y: 0 }, { x: 350, y: 0 }, { x: 900, y: 0 }, { x: 0, y: 380 }, { x: 350, y: 380 }, { x: 700, y: 380 }],
  minimumZoom: 0.7,
  padding: 48,
  focusZoom: 1,
  previewDuration: 0,
  cameraDuration: 800,
  countDuration: 600,
  dimmedOpacity: 0.4,
};

export function elbowHandoff(sx: number, sy: number, tx: number, ty: number) {
  const lane = (sy + ty) / 2;
  const midpoint = (sx + tx) / 2;
  return { path: `M ${sx},${sy} C ${sx},${lane} ${sx},${lane} ${midpoint},${lane} C ${tx},${lane} ${tx},${lane} ${tx},${ty - 10}`, labelX: midpoint, labelY: lane - 22 };
}

export function easeInOut(progress: number) {
  return progress < 0.5 ? 2 * progress * progress : 1 - (-2 * progress + 2) ** 2 / 2;
}

export type CanvasBounds = { x: number; y: number; width: number; height: number };
export function clearLabelPosition(x: number, y: number, width: number, height: number, nodes: CanvasBounds[], gap: number): { x: number; y: number } {
  let top = y;
  for (let i = 0; i <= nodes.length; i++) {
    const collisions = nodes.filter(node => x + width / 2 > node.x - gap && x - width / 2 < node.x + node.width + gap && top + height > node.y - gap && top < node.y + node.height + gap);
    if (collisions.length === 0) break;
    top = Math.max(...collisions.map(node => node.y + node.height + gap));
  }
  return { x, y: top };
}
export const replayFit = { padding: 32, bottomSpace: 80, maxZoom: 0.85, minZoom: 0.4, toastSpace: 72, paidAgainReserve: 40 };
/** Fit bounds inside the canvas with fixed screen padding, reserved toast space on top and empty space below the lowest node. */
export function replayViewport(bounds: CanvasBounds, width: number, height: number) {
  const { padding, bottomSpace, maxZoom, minZoom, toastSpace } = replayFit;
  const top = padding + toastSpace, bottom = padding + bottomSpace;
  const zoom = Math.max(minZoom, Math.min(maxZoom, (width - 2 * padding) / bounds.width, (height - top - bottom) / bounds.height));
  return { x: (width - bounds.width * zoom) / 2 - bounds.x * zoom, y: top + (height - top - bottom - bounds.height * zoom) / 2 - bounds.y * zoom, zoom };
}
