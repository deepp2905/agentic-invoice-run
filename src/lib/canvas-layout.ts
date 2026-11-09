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