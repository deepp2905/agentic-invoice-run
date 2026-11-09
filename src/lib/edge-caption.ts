import type { CanvasBounds } from "@/lib/canvas-layout";

export function placeEdgeCaption(anchor: { x: number; y: number }, size: { width: number; height: number }, nodes: CanvasBounds[], zoom: number) {
  const gap = 8 / zoom, offset = 12 / zoom;
  const fits = (x: number, y: number, width: number, height: number) => !nodes.some(node =>
    x + width / 2 > node.x - gap && x - width / 2 < node.x + node.width + gap && y + height > node.y - gap && y < node.y + node.height + gap);
  // Never move a caption down the page: use only positions adjacent to its line.
  for (const y of [anchor.y + offset, anchor.y - offset - size.height]) {
    if (fits(anchor.x, y, size.width, size.height)) return { x: anchor.x, y, compact: false };
  }
  const compactSize = 20 / zoom;
  for (const y of [anchor.y + offset, anchor.y - offset - compactSize]) {
    if (fits(anchor.x, y, compactSize, compactSize)) return { x: anchor.x, y, compact: true };
  }
  // An edge squeezed against a node must not cover the node just to show a caption.
  return null;
}