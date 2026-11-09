import { useCallback, useEffect, useRef, useState } from "react";
import { Background, BackgroundVariant, BaseEdge, EdgeLabelRenderer, Handle, Position, ReactFlow, ReactFlowProvider, getViewportForBounds, useNodesInitialized, useNodesState, useReactFlow, useUpdateNodeInternals, useViewport, type Edge, type EdgeProps, type Node, type NodeProps, type Viewport } from "@xyflow/react";
import { IconCheck as Check, IconCircleDashed as CircleDashed, IconFileSearch as FileScan, IconFiles as Files, IconGitCompare as GitCompareArrows, IconLoader2 as LoaderCircle, IconMinus as Minus, IconPlus as Plus, IconReceipt as Receipt, IconRestore as RotateCcw, IconShieldCheck as ShieldCheck, IconPlayerSkipForward as SkipForward, IconAlertTriangle as AlertTriangle, IconX as X } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { Agent } from "@/lib/mock-data";
import type { RunDetail } from "@/lib/mock-runs";
import { queuedInvoiceState } from "@/lib/prototype-state";
import { handoffOutcome, hasNewReceipt, nodeOutcome, type NodeOutcome, type ReplayFlow } from "@/lib/replay-flow";
import { Hint } from "@/components/Hint";
import { Chip, IconButton } from "@/components/system";
import { resolveOverlap } from "@/lib/node-collision";
import { flowConnections, type ConnectionSide } from "@/lib/flow-connections";
import { canvasLayout, easeInOut, elbowHandoff, type CanvasBounds } from "@/lib/canvas-layout";
import { placeEdgeCaption } from "@/lib/edge-caption";

type FlowData = { run: RunDetail; kind: "agent" | "queue" | "output"; agent?: Agent | undefined; outcome: NodeOutcome; detail: string; paused: boolean; paidAgain: boolean; count: number; incoming?: ConnectionSide | undefined; outgoing?: ConnectionSide | undefined; onInspect: (agent: Agent) => void };
type FlowNode = Node<FlowData, "inspection">;
const icons = { pending: CircleDashed, running: LoaderCircle, success: Check, warning: AlertTriangle, failed: X, skipped: SkipForward };
const labels = { pending: "Waiting", running: "Running…", success: "Successful", warning: "Warning", failed: "Held for review", skipped: "Not paid" };
const sidePositions = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
const titles: Record<string, string> = { extraction: "Read invoice", matching: "Match purchase order", policy: "Check duplicates", payment: "Issue payment" };
const stationIcons: Record<string, typeof FileScan> = { extraction: FileScan, matching: GitCompareArrows, policy: ShieldCheck, payment: Receipt };

function InspectionNode({ id, data }: NodeProps<FlowNode>) {
  const matching = id === "matching";
  const warningMatch = matching && data.run.duplicate;
  const Icon = warningMatch ? AlertTriangle : icons[data.outcome];
  const StationIcon = data.agent ? stationIcons[data.agent.id] ?? FileScan : data.kind === "queue" ? Files : Receipt;
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, data.incoming, data.outgoing, updateNodeInternals]);
  const inspect = () => { if (data.agent) data.onInspect(data.agent); };
  return <div className={`inspection-node ${warningMatch ? "inspection-node-matching" : ""} outcome-${data.outcome}`}>
    {data.incoming && <Handle type="target" position={sidePositions[data.incoming]} id="incoming" className="connection-target" />}
    <div className="node-heading flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2 font-semibold">{!warningMatch && <StationIcon className="size-4 shrink-0" aria-hidden="true" />}{data.agent ? titles[id] : data.kind === "queue" ? "Invoice queue" : "Payment receipts"}</span>
      {data.agent && <Hint label={warningMatch ? "Low match confidence" : labels[data.outcome]}><Icon className={`size-4 shrink-0 ${warningMatch ? "text-warning" : "node-status"} ${data.outcome === "running" && !warningMatch ? "motion-safe:animate-spin" : ""}`} aria-label={warningMatch ? "Warning" : labels[data.outcome]} /></Hint>}
    </div>
    {warningMatch ? <>
      <div><p className={`confidence-value font-mono font-semibold ${warningMatch ? "text-warning" : "text-success"}`}>{data.count}%</p><p className="confidence-caption text-muted-foreground">match confidence</p></div>
      <div className="confidence-meter" role="meter" aria-label="Matching confidence" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.agent?.confidence}><div className={`h-full ${warningMatch ? "bg-warning" : "bg-success"}`} style={{ width: `${data.count}%` }} /></div>
      <Chip tone={warningMatch ? "warning" : "success"} className="node-tag">{warningMatch ? "Should have been caught" : "Verified PO match"}</Chip>
      <Button variant="outline" className="node-review nodrag nopan w-full shadow-none" aria-label="Matching: Review match" onClick={inspect}>Review match</Button>
    </> : data.agent ? <>
      <Button variant="ghost" className="node-detail nodrag nopan" aria-label={matching ? "Matching: Review match" : `Open ${data.agent.name} details`} onClick={inspect}>{matching && data.outcome === "success" ? <><span>{data.run.po} ·</span><span className="text-success">{data.agent.confidence}% match</span></> : data.detail}</Button>
      {data.outcome === "failed" && <Button variant="destructive" className="nodrag nopan w-full" aria-label="Policy: Review hold" onClick={inspect}>Review hold</Button>}
    </> : data.kind === "queue" ? <div className="node-invoices">{data.run.queue.map(invoice => {
      const status = queuedInvoiceState(invoice, data.paused);
      return <div key={invoice.id} className="flex flex-wrap items-center justify-between gap-1"><span className="font-mono">{invoice.id}</span><span className={status === "safe" ? "text-success" : status === "paused" ? "text-warning" : "text-muted-foreground"}>{status === "safe" ? "Safe to release" : status === "paused" ? "Paused" : "Queued"}</span></div>;
    })}{data.run.queue.length === 0 && <><p className="font-mono">{data.run.id}</p><p className="text-muted-foreground">{data.run.vendor}</p><p className="text-success">Processed · No queued invoices</p></>}</div> : <div className="node-invoices"><p className="font-mono">{data.run.duplicate ? "INV-4821" : data.run.id}</p><p className="text-muted-foreground">{data.run.duplicate ? "Paid Oct 29" : `Paid ${data.run.date}`} · {data.run.amount}</p>{!data.run.duplicate && <p className="text-success">{data.run.receipt} · Payment confirmed</p>}{data.paidAgain && <p className="text-destructive">{data.run.id} · Paid again · {data.run.amount}</p>}</div>}
    {data.outgoing && <Handle type="source" position={sidePositions[data.outgoing]} id="outgoing" />}
  </div>;
}

function StringEdge(props: EdgeProps) {
  const { zoom } = useViewport();
  const labelElement = useRef<HTMLDivElement>(null);
  const [labelSize, setLabelSize] = useState({ width: 100, height: 68 });
  useEffect(() => {
    const element = labelElement.current;
    if (!element) return;
    const update = () => setLabelSize({ width: element.offsetWidth, height: element.offsetHeight });
    const observer = new ResizeObserver(update); observer.observe(element); update();
    return () => observer.disconnect();
  }, [props.data?.['label']]);
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
  const labelY = elbow ? (sy + ty) / 2 : (sy + 3 * (sy + sny * reach) + 3 * (ey + tny * reach) + ey) / 8;
  const nodeBounds = props.data?.['bounds'] as CanvasBounds[] | undefined;
  const labelPosition = placeEdgeCaption({ x: labelX, y: labelY }, labelSize, nodeBounds ?? [], zoom);
  return <><g className={`flow-string ${active ? "flow-string-active" : ""} ${stateClass}`}>
    <defs><marker id={markerId} viewBox="0 -5 10 10" refX="0" refY="0" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0,-5 L 10,0 L 0,5 Z" className="flow-string-arrow" /></marker></defs>
    <BaseEdge id={props.id} path={path} markerEnd={`url(#${markerId})`} />
    {active && <path d={path} className="flow-string-pulse" />}
  </g>{typeof label === "string" && <EdgeLabelRenderer><div ref={labelElement} aria-hidden={!labelPosition || labelPosition.compact} className={`flow-edge-label ${elbow ? "flow-edge-label-elbow" : ""} nodrag nopan ${state === "failed" ? "text-destructive" : props.data?.['warning'] ? "text-warning" : "text-foreground"}`} style={{ visibility: !labelPosition || labelPosition.compact ? "hidden" : "visible", transform: `translate(-50%, 0) translate(${labelPosition?.x ?? labelX}px, ${labelPosition?.y ?? labelY}px)` }}>{label}</div>{labelPosition?.compact && <div className="nodrag nopan pointer-events-auto absolute" style={{ transform: `translate(-50%, 0) translate(${labelPosition.x}px, ${labelPosition.y}px) scale(${1 / zoom})`, transformOrigin: "top center" }}><Hint label={label}><Button size="icon" variant="secondary" aria-label={label} className={`size-5 rounded-full ${state === "failed" ? "text-destructive" : props.data?.['warning'] ? "text-warning" : "text-muted-foreground"}`}><span className="text-xs" aria-hidden="true">i</span></Button></Hint></div>}</EdgeLabelRenderer>}</>;
}
const nodeTypes = { inspection: InspectionNode }, edgeTypes = { string: StringEdge };
const ids = ["queue", "extraction", "matching", "policy", "payment", "output"];

function CanvasControls({ onFull, onReset, onInterrupt }: { onFull: () => void; onReset: () => void; onInterrupt: () => void }) {
  const { zoomIn, zoomOut } = useReactFlow();
  const { zoom } = useViewport();
  return <div className="canvas-control-band flex shrink-0 items-center border-t border-border bg-background px-3 py-2"><div className="canvas-controls flex flex-wrap items-center gap-1 rounded-md border border-border bg-card p-1">
    <Button variant="ghost" onClick={onFull}>Fit to view</Button>
    <IconButton label="Zoom out" icon={Minus} onClick={() => { onInterrupt(); zoomOut(); }} />
    <span className="w-12 text-center font-mono text-xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
    <IconButton label="Zoom in" icon={Plus} onClick={() => { onInterrupt(); zoomIn(); }} />
    <IconButton label="Reset layout" icon={RotateCcw} onClick={onReset} />
  </div></div>;
}
export function InvestigationCanvas(props: { run: RunDetail; replay: ReplayFlow | null; paused: boolean; onInspect: (agent: Agent) => void }) {
  return <ReactFlowProvider><Canvas {...props} /></ReactFlowProvider>;
}
function Canvas({ run, replay, paused, onInspect }: { run: RunDetail; replay: ReplayFlow | null; paused: boolean; onInspect: (agent: Agent) => void }) {
  const initialized = useNodesInitialized();
  const container = useRef<HTMLDivElement>(null), initializedOnce = useRef(false), frame = useRef(0), delay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduced = useRef(false), [focus, setFocus] = useState<string | null>(null), [count, setCount] = useState(run.agents[1]?.confidence ?? 62);
  const { getViewport, setViewport, getNodesBounds, getNode } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(ids.map((id, i) => ({ id, type: "inspection", position: canvasLayout.positions[i] ?? { x: 0, y: 0 }, data: { run, kind: i === 0 ? "queue" : i === 5 ? "output" : "agent", agent: run.agents[i - 1], outcome: "pending", detail: "", paused, paidAgain: false, count: 62, onInspect } })));
  const cancel = useCallback(() => { cancelAnimationFrame(frame.current); if (delay.current) clearTimeout(delay.current); delay.current = null; setCount(run.agents[1]?.confidence ?? 62); }, [run]);
  const animate = useCallback((target: Viewport, duration: number, counting = false) => {
    cancel();
    if (reduced.current || duration === 0) { setViewport(target); return; }
    const start = getViewport(), started = performance.now();
    if (counting) setCount(0);
    const step = (now: number) => {
      const elapsed = now - started, progress = Math.min(elapsed / duration, 1), eased = easeInOut(progress);
      setViewport({ x: start.x + (target.x - start.x) * eased, y: start.y + (target.y - start.y) * eased, zoom: start.zoom + (target.zoom - start.zoom) * eased });
      if (counting) setCount(Math.round((run.agents[1]?.confidence ?? 62) * Math.min(elapsed / canvasLayout.countDuration, 1)));
      if (progress < 1) frame.current = requestAnimationFrame(step);
    };
    frame.current = requestAnimationFrame(step);
  }, [cancel, getViewport, setViewport, run]);
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
    if (run.duplicate) focusNode("matching");
  }, [initialized, fullFlow, focusNode, run]);
  useEffect(() => {
    if (!initialized || !replay) return;
    if (replay.index === 0 && replay.phase === "running") fullFlow();
    if (run.duplicate && replay.phase === "complete" && replay.rule === "combined") {
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
    const outcome = !run.duplicate && !replay ? "success" : nodeOutcome(i - 1, replay);
    const detail = outcome === "pending" ? "Awaiting invoice" : outcome === "running" ? `Processing ${run.id}` : i === 1 ? `${run.id} · ${run.amount}` : i === 2 ? `${run.po} · ${run.agents[1]?.confidence ?? 0}% match` : i === 3 ? outcome === "failed" ? "Held for review" : "Duplicate check passed" : i === 4 ? outcome === "skipped" ? "Not paid" : `Paid ${run.amount}` : "";
    return { ...node, className: focus === node.id ? `canvas-node-focused ${node.id === "matching" && run.duplicate ? "canvas-match-focused" : ""}` : focus ? "canvas-node-dimmed" : "", data: { ...node.data, incoming: connections[i - 1]?.target, outgoing: connections[i]?.source, outcome: i === 0 || i === 5 ? "pending" as const : outcome, detail, paused, onInspect, paidAgain: hasNewReceipt(replay), count } };
  });
  const edges: Edge[] = ids.slice(0, -1).map((source, i) => {
    const state = !run.duplicate && !replay ? "success" : handoffOutcome(i - 1, replay);
    const label = i === 1 ? "Passed extracted fields" : i === 2 ? state === "failed" ? "Duplicate flagged" : run.duplicate ? "Handed off without a flag" : "Passed verified PO match" : i === 3 && state !== "failed" ? "Approved for payment" : undefined;
    return { id: `string-${i}`, source, target: ids[i + 1] ?? "output", sourceHandle: "outgoing", targetHandle: "incoming", type: "string", data: { active: replay?.phase === "handoff" && replay.index === i - 1, state, label, warning: i === 2 && run.duplicate, elbow: i === 2, bounds } };
  });
  return <div className="flex min-h-0 flex-1 flex-col"><div ref={container} className={`investigation-canvas relative min-h-0 flex-1 overflow-hidden ${focus ? "canvas-is-focused" : ""}`} aria-label="Invoice investigation canvas" onWheelCapture={interrupt} onPointerDownCapture={event => { if (!(event.target instanceof Element) || !event.target.closest('.canvas-controls, .nodrag')) interrupt(); }}>
    <ReactFlow nodes={visibleNodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} edgeTypes={edgeTypes} minZoom={canvasLayout.minimumZoom} maxZoom={1.8} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false} nodeDragThreshold={4} onNodeDragStart={interrupt} onNodeDragStop={(_, dragged) => setNodes(current => {
      const size = (n: FlowNode) => ({ width: n.measured?.width ?? 240, height: n.measured?.height ?? 140 });
      const others = current.filter(n => n.id !== dragged.id).map(n => ({ ...n.position, ...size(n) }));
      const position = resolveOverlap({ ...dragged.position, ...size(dragged) }, others);
      return current.map(n => n.id === dragged.id ? { ...n, position } : n);
    })} proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
    </ReactFlow>
  </div><CanvasControls onInterrupt={interrupt} onFull={() => fullFlow()} onReset={() => { interrupt(); setNodes(current => current.map((node, i) => ({ ...node, position: canvasLayout.positions[i] ?? node.position }))); delay.current = setTimeout(() => fullFlow(), 100); }} /></div>;
}
