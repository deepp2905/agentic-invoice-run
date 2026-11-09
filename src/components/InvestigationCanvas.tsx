import { useCallback, useEffect, useRef, useState } from "react";
import { Background, BackgroundVariant, BaseEdge, EdgeLabelRenderer, Handle, Position, ReactFlow, ReactFlowProvider, getViewportForBounds, useNodesInitialized, useNodesState, useReactFlow, useUpdateNodeInternals, useViewport, type Edge, type EdgeProps, type Node, type NodeProps, type Viewport } from "@xyflow/react";
import { IconCheck as Check, IconCircleDashed as CircleDashed, IconFileSearch as FileScan, IconFiles as Files, IconGitCompare as GitCompareArrows, IconLoader2 as LoaderCircle, IconMaximize as Maximize, IconMinus as Minus, IconPlus as Plus, IconReceipt as Receipt, IconRestore as RotateCcw, IconShieldCheck as ShieldCheck, IconPlayerSkipForward as SkipForward, IconAlertTriangle as AlertTriangle, IconX as X } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { agents, type Agent } from "@/lib/mock-data";
import { queuedInvoices } from "@/lib/prototype-state";
import { handoffOutcome, hasNewReceipt, nodeOutcome, type NodeOutcome, type ReplayFlow } from "@/lib/replay-flow";
import { Hint } from "@/components/Hint";
import { Chip, IconButton } from "@/components/system";
import { resolveOverlap } from "@/lib/node-collision";
import { flowConnections, type ConnectionSide } from "@/lib/flow-connections";
import { canvasLayout, easeInOut, elbowHandoff } from "@/lib/canvas-layout";

type FlowData = { kind: "agent" | "queue" | "output"; agent?: Agent | undefined; outcome: NodeOutcome; detail: string; paused: boolean; paidAgain: boolean; count: number; incoming?: ConnectionSide | undefined; outgoing?: ConnectionSide | undefined; onInspect: (agent: Agent) => void };
type FlowNode = Node<FlowData, "inspection">;
const icons = { pending: CircleDashed, running: LoaderCircle, success: Check, warning: AlertTriangle, failed: X, skipped: SkipForward };
const labels = { pending: "Waiting", running: "Running…", success: "Successful", warning: "Warning", failed: "Held for review", skipped: "Not paid" };
const sidePositions = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
const titles: Record<string, string> = { extraction: "Read invoice", matching: "Match purchase order", policy: "Check duplicates", payment: "Issue payment" };
const stationIcons: Record<string, typeof FileScan> = { extraction: FileScan, matching: GitCompareArrows, policy: ShieldCheck, payment: Receipt };

function InspectionNode({ id, data }: NodeProps<FlowNode>) {
  const matching = id === "matching";
  const Icon = matching ? AlertTriangle : icons[data.outcome];
  const StationIcon = data.agent ? stationIcons[data.agent.id] ?? FileScan : data.kind === "queue" ? Files : Receipt;
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, data.incoming, data.outgoing, updateNodeInternals]);
  const inspect = () => { if (data.agent) data.onInspect(data.agent); };
  return <div className={`inspection-node ${matching ? "inspection-node-matching" : ""} outcome-${data.outcome}`}>
    {data.incoming && <Handle type="target" position={sidePositions[data.incoming]} id="incoming" className="connection-target" />}
    <div className="node-heading flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 font-semibold">{!matching && <StationIcon className="size-4 shrink-0" aria-hidden="true" />}{data.agent ? titles[id] : data.kind === "queue" ? "Invoice queue" : "Payment receipts"}</span>
      {data.agent && <Hint label={matching ? "Low match confidence" : labels[data.outcome]}><Icon className={`size-4 shrink-0 ${matching ? "text-warning" : "node-status"} ${data.outcome === "running" && !matching ? "motion-safe:animate-spin" : ""}`} aria-label={matching ? "Warning" : labels[data.outcome]} /></Hint>}
    </div>
    {matching ? <>
      <div><p className="confidence-value font-mono font-semibold text-warning">{data.count}%</p><p className="confidence-caption text-muted-foreground">match confidence</p></div>
      <div className="confidence-meter" role="meter" aria-label="Matching confidence" aria-valuemin={0} aria-valuemax={100} aria-valuenow={62}><div className="confidence-meter-fill" /></div>
      <Chip tone="warning" className="node-tag">Should have been caught</Chip>
      <Button variant="outline" className="node-review nodrag nopan w-full shadow-none" aria-label="Matching: Review match" onClick={inspect}>Review match</Button>
    </> : data.agent ? <>
      <Button variant="ghost" className="node-detail nodrag nopan" aria-label={`Open ${data.agent.name} details`} onClick={inspect}>{data.detail}</Button>
      {data.outcome === "failed" && <Button variant="destructive" className="nodrag nopan w-full" aria-label="Policy: Review hold" onClick={inspect}>Review hold</Button>}
    </> : data.kind === "queue" ? <div className="node-invoices">{queuedInvoices.map(invoice => <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-1"><span className="font-mono">{invoice.id}</span><span className={data.paused ? "text-warning" : invoice.legit ? "text-success" : "text-muted-foreground"}>{data.paused ? "Paused" : invoice.legit ? "Safe to release" : "Queued"}</span></div>)}</div> : <div className="node-invoices"><p className="font-mono">INV-4821</p><p className="text-muted-foreground">Paid Oct 29 · $12,480</p>{data.paidAgain && <p className="text-destructive">INV-4821-A · Paid again · $12,480</p>}</div>}
    {data.outgoing && <Handle type="source" position={sidePositions[data.outgoing]} id="outgoing" />}
  </div>;
}

function StringEdge(props: EdgeProps) {
  const normals = { [Position.Left]: [-1, 0], [Position.Right]: [1, 0], [Position.Top]: [0, -1], [Position.Bottom]: [0, 1] } as const;
  const [snx, sny] = normals[props.sourcePosition], [tnx, tny] = normals[props.targetPosition];
  const { sourceX: sx, sourceY: sy, targetX: tx, targetY: ty } = props;
  const ex = tx + tnx * 10, ey = ty + tny * 10;
  const reach = Math.min(160, Math.max(40, Math.hypot(ex - sx, ey - sy) * 0.4));
  const elbow = props.data?.['elbow'] === true ? elbowHandoff(sx, sy, tx, ty) : null;
  const path = elbow?.path ?? `M ${sx},${sy} C ${sx + snx * reach},${sy + sny * reach} ${ex + tnx * reach},${ey + tny * reach} ${ex},${ey}`;
  const active = props.data?.['active'] === true, state = props.data?.['state'];
  const stateClass = state === "success" ? "flow-string-success" : state === "warning" ? "flow-string-warning" : state === "failed" ? "flow-string-failed" : "";
  const markerId = `curve-arrow-${props.id}`, label = props.data?.['label'];
  const labelX = elbow?.labelX ?? (sx + 3 * (sx + snx * reach) + 3 * (ex + tnx * reach) + ex) / 8;
  const labelY = elbow?.labelY ?? (sy + 3 * (sy + sny * reach) + 3 * (ey + tny * reach) + ey) / 8 - 28;
  return <><g className={`flow-string ${active ? "flow-string-active" : ""} ${stateClass}`}>
    <defs><marker id={markerId} viewBox="0 -5 10 10" refX="0" refY="0" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0,-5 L 10,0 L 0,5 Z" className="flow-string-arrow" /></marker></defs>
    <BaseEdge id={props.id} path={path} markerEnd={`url(#${markerId})`} />
    {active && <path d={path} className="flow-string-pulse" />}
  </g>{typeof label === "string" && <EdgeLabelRenderer><div className={`flow-edge-label ${elbow ? "flow-edge-label-elbow" : ""} nodrag nopan ${state === "failed" ? "text-destructive" : props.data?.['warning'] ? "text-warning" : "text-foreground"}`} style={{ transform: `translate(-50%, -100%) translate(${labelX}px, ${labelY}px)` }}>{label}</div></EdgeLabelRenderer>}</>;
}
const nodeTypes = { inspection: InspectionNode }, edgeTypes = { string: StringEdge };
const ids = ["queue", ...agents.map(a => a.id), "output"];

function CanvasControls({ onFull, onReset, onInterrupt }: { onFull: () => void; onReset: () => void; onInterrupt: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  return <div className="canvas-controls absolute right-3 top-2 z-10 flex items-center gap-1 rounded-md border border-border bg-card p-1">
    <Button variant="ghost" onClick={onFull}>Show full flow</Button>
    <IconButton label="Zoom out" icon={Minus} onClick={() => { onInterrupt(); zoomOut(); }} />
    <span className="w-12 text-center font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
    <IconButton label="Zoom in" icon={Plus} onClick={() => { onInterrupt(); zoomIn(); }} />
    <IconButton label="Fit flow" icon={Maximize} onClick={onFull} />
    <IconButton label="Reset layout" icon={RotateCcw} onClick={onReset} />
  </div>;
}
export function InvestigationCanvas(props: { replay: ReplayFlow | null; paused: boolean; onInspect: (agent: Agent) => void }) {
  return <ReactFlowProvider><Canvas {...props} /></ReactFlowProvider>;
}
function Canvas({ replay, paused, onInspect }: { replay: ReplayFlow | null; paused: boolean; onInspect: (agent: Agent) => void }) {
  const initialized = useNodesInitialized();
  const container = useRef<HTMLDivElement>(null), initializedOnce = useRef(false), frame = useRef(0), delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useRef(false), [focus, setFocus] = useState<string | null>(null), [count, setCount] = useState(62);
  const { getViewport, setViewport, getNodesBounds, getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(ids.map((id, i) => ({ id, type: "inspection", position: canvasLayout.positions[i] ?? { x: 0, y: 0 }, data: { kind: i === 0 ? "queue" : i === 5 ? "output" : "agent", agent: agents[i - 1], outcome: "pending", detail: "", paused, paidAgain: false, count: 62, onInspect } })));
  const cancel = useCallback(() => { cancelAnimationFrame(frame.current); if (delay.current) clearTimeout(delay.current); delay.current = null; setCount(62); }, []);
  const animate = useCallback((target: Viewport, duration: number, counting = false) => {
    cancel();
    if (reduced.current || duration === 0) { setViewport(target); return; }
    const start = getViewport(), started = performance.now();
    if (counting) setCount(0);
    const step = (now: number) => {
      const elapsed = now - started, progress = Math.min(elapsed / duration, 1), eased = easeInOut(progress);
      setViewport({ x: start.x + (target.x - start.x) * eased, y: start.y + (target.y - start.y) * eased, zoom: start.zoom + (target.zoom - start.zoom) * eased });
      if (counting) setCount(Math.round(62 * Math.min(elapsed / canvasLayout.countDuration, 1)));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [cancel, getViewport, setViewport]);
  const fullFlow = useCallback((duration = canvasLayout.cameraDuration) => {
    setFocus(null);
    const element = container.current;
    if (!element) return;
    animate(getViewportForBounds(getNodesBounds(ids), element.clientWidth, element.clientHeight, canvasLayout.minimumZoom, 1, `${canvasLayout.padding}px`), duration);
  }, [animate, getNodesBounds]);
  const focusNode = useCallback((id: string) => {
    const node = getNode(id), element = container.current;
    if (!node || !element) return;
    setFocus(id);
    if (reduced.current) { cancel(); return; }
    const x = node.position.x + (node.measured?.width ?? 240) / 2, y = node.position.y + (node.measured?.height ?? 140) / 2;
    animate({ x: element.clientWidth / 2 - x, y: element.clientHeight / 2 - y, zoom: canvasLayout.focusZoom }, canvasLayout.cameraDuration, id === "matching");
  }, [animate, cancel, getNode]);
  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduced.current = media.matches;
    const change = () => { reduced.current = media.matches; if (media.matches) cancel(); };
    media.addEventListener("change", change);
    return () => { media.removeEventListener("change", change); cancel(); };
  }, [cancel]);
  useEffect(() => {
    if (!initialized || initializedOnce.current) return;
    initializedOnce.current = true;
    fullFlow(0);
    if (reduced.current) focusNode("matching");
    else delay.current = setTimeout(() => focusNode("matching"), canvasLayout.previewDuration);
  }, [initialized, fullFlow, focusNode]);
  useEffect(() => {
    if (!initialized || !replay) return;
    if (replay.index === 0 && replay.phase === "running") fullFlow();
    if (replay.phase === "complete" && replay.rule === "combined") {
      cancel();
      delay.current = setTimeout(() => focusNode("policy"), 100);
    }
  }, [initialized, replay?.index, replay?.phase, replay?.rule, fullFlow, focusNode, cancel]);
  const interrupt = () => { cancel(); setFocus(null); };
  const bounds = nodes.map(node => ({ ...node.position, width: node.measured?.width ?? (node.id === "matching" ? 336 : 240), height: node.measured?.height ?? 140 }));
  const connections = flowConnections(bounds);
  if (connections[1]) connections[1].target = "left";
  if (connections[2]) { connections[2].source = "bottom"; connections[2].target = "top"; }
  const visibleNodes = nodes.map((node, i) => {
    const outcome = nodeOutcome(i - 1, replay);
    const detail = outcome === "pending" ? "Awaiting invoice" : outcome === "running" ? "Processing INV-4821-A" : i === 1 ? "INV-4821-A · $12,480" : i === 3 ? outcome === "failed" ? "Held for review" : "Duplicate check passed" : i === 4 ? outcome === "skipped" ? "Not paid" : "Paid $12,480" : "";
    return { ...node, className: focus === node.id ? `canvas-node-focused ${node.id === "matching" ? "canvas-match-focused" : ""}` : focus ? "canvas-node-dimmed" : "", data: { ...node.data, incoming: connections[i - 1]?.target, outgoing: connections[i]?.source, outcome: i === 0 || i === 5 ? "pending" as const : outcome, detail, paused, onInspect, paidAgain: hasNewReceipt(replay), count } };
  });
  const edges: Edge[] = ids.slice(0, -1).map((source, i) => {
    const state = handoffOutcome(i - 1, replay);
    const label = i === 1 ? "Passed extracted fields" : i === 2 ? state === "failed" ? "Duplicate flagged" : "Handed off without a flag" : i === 3 && state !== "failed" ? "Approved for payment" : undefined;
    return { id: `string-${i}`, source, target: ids[i + 1] ?? "output", sourceHandle: "outgoing", targetHandle: "incoming", type: "string", data: { active: replay?.phase === "handoff" && replay.index === i - 1, state, label, warning: i === 2, elbow: i === 2 } };
  });
  return <div ref={container} className={`investigation-canvas relative min-h-0 flex-1 ${focus ? "canvas-is-focused" : ""}`} aria-label="Invoice investigation canvas" onWheelCapture={interrupt} onPointerDownCapture={event => { if (!(event.target instanceof Element) || !event.target.closest('.canvas-controls, .nodrag')) interrupt(); }}>
    <ReactFlow nodes={visibleNodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} edgeTypes={edgeTypes} minZoom={canvasLayout.minimumZoom} maxZoom={1.8} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false} nodeDragThreshold={4} onNodeDragStart={interrupt} onNodeDragStop={(_, dragged) => setNodes(current => {
      const size = (n: FlowNode) => ({ width: n.measured?.width ?? 240, height: n.measured?.height ?? 140 });
      const others = current.filter(n => n.id !== dragged.id).map(n => ({ ...n.position, ...size(n) }));
      const position = resolveOverlap({ ...dragged.position, ...size(dragged) }, others);
      return current.map(n => n.id === dragged.id ? { ...n, position } : n);
    })} proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      <CanvasControls onInterrupt={interrupt} onFull={() => fullFlow()} onReset={() => { interrupt(); setNodes(current => current.map((node, i) => ({ ...node, position: canvasLayout.positions[i] ?? node.position }))); delay.current = setTimeout(() => fullFlow(), 100); }} />
    </ReactFlow>
  </div>;
}
