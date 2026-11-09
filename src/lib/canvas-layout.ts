export const canvasLayout = {
  positions: [{ x: 0, y: 0 }, { x: 350, y: 0 }, { x: 700, y: 0 }, { x: 0, y: 380 }, { x: 350, y: 380 }, { x: 700, y: 380 }],
  minimumZoom: 0.7,
  padding: 48,
  focusZoom: 1,
  previewDuration: 400,
  cameraDuration: 800,
  countDuration: 600,
  dimmedOpacity: 0.4,
};

export function elbowHandoff(sx: number, sy: number, tx: number, ty: number) {
  const lane = (sy + ty) / 2;
  return { path: `M ${sx},${sy} L ${sx},${lane} L ${tx},${lane} L ${tx},${ty - 10}`, labelX: (sx + tx) / 2, labelY: lane - 22 };
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