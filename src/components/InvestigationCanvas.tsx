import { useEffect, useRef } from "react";
import { Background, BackgroundVariant, BaseEdge, EdgeLabelRenderer, Handle, Position, ReactFlow, ReactFlowProvider, useNodesInitialized, useNodesState, useReactFlow, useUpdateNodeInternals, useViewport, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { IconCheck as Check, IconCircleDashed as CircleDashed, IconFileSearch as FileScan, IconFiles as Files, IconGitCompare as GitCompareArrows, IconLoader2 as LoaderCircle, IconMaximize as Maximize, IconMinus as Minus, IconPlus as Plus, IconReceipt as Receipt, IconRestore as RotateCcw, IconShieldCheck as ShieldCheck, IconPlayerSkipForward as SkipForward, IconAlertTriangle as AlertTriangle, IconX as X } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { agents, type Agent } from "@/lib/mock-data";
import { queuedInvoices } from "@/lib/prototype-state";
import { handoffOutcome, hasNewReceipt, nodeOutcome, type NodeOutcome, type ReplayFlow } from "@/lib/replay-flow";
import { Hint } from "@/components/Hint";
import { Chip, IconButton, InsetRow } from "@/components/system";
import { resolveOverlap } from "@/lib/node-collision";
import { flowConnections, type ConnectionSide } from "@/lib/flow-connections";

type FlowData = { kind: "agent" | "queue" | "output"; agent?: Agent | undefined; outcome: NodeOutcome; detail: string; paused: boolean; paidAgain: boolean; incoming?: ConnectionSide | undefined; outgoing?: ConnectionSide | undefined; onInspect: (agent: Agent) => void };
type FlowNode = Node<FlowData, "inspection">;
const icons = { pending: CircleDashed, running: LoaderCircle, success: Check, warning: AlertTriangle, failed: X, skipped: SkipForward };
const labels = { pending: "Waiting", running: "Running…", success: "Successful", warning: "Warning", failed: "Held for review", skipped: "Not paid" };

const LOW_CONFIDENCE = 80;
const sidePositions = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
const titles: Record<string, string> = { extraction: "Read invoice", matching: "Match purchase order", policy: "Check duplicates", payment: "Issue payment" };
const stationIcons: Record<string, typeof FileScan> = { extraction: FileScan, matching: GitCompareArrows, policy: ShieldCheck, payment: Receipt };

function InspectionNode({ id, data }: NodeProps<FlowNode>) {
  const Icon = icons[data.outcome];
  const StationIcon = data.agent ? stationIcons[data.agent.id] ?? FileScan : data.kind === "queue" ? Files : Receipt;
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, data.incoming, data.outgoing, updateNodeInternals]);
  const review = data.outcome === "warning" ? "Review match" : data.outcome === "failed" ? "Review hold" : null;
  return <div className={`inspection-node ${data.agent?.id === "matching" ? "inspection-node-matching" : ""} outcome-${data.outcome}`}>
    {data.incoming && <Handle type="target" position={sidePositions[data.incoming]} id="incoming" className="connection-target" />}
    <div className="node-heading flex items-center justify-between gap-2 px-3">
      <span className="flex min-w-0 items-center gap-1.5 font-semibold"><StationIcon className="size-5 shrink-0" aria-hidden="true" />{data.agent ? titles[data.agent.id] : data.kind === "queue" ? "Invoice queue" : "Payment receipts"}</span>
      {data.agent && <Hint label={labels[data.outcome]}><Icon className={`size-5 shrink-0 node-status ${data.outcome === "running" ? "motion-safe:animate-spin" : ""}`} aria-label={labels[data.outcome]} /></Hint>}
    </div>
    {data.agent ? <>
      <div className="flex flex-col gap-1.5 px-2 pb-2">
        <InsetRow className="nodrag cursor-pointer" onClick={() => { if (data.agent) data.onInspect(data.agent); }} label={`Open ${data.agent.name} details`}>
          <p className="mb-1 text-muted-foreground">{data.agent.name}</p>
          <p className="min-h-8 leading-relaxed">{data.detail}</p>
        </InsetRow>
        {data.agent.confidence < LOW_CONFIDENCE && <div className="matching-confidence px-2 py-2 text-warning">
          <div className="flex items-center gap-3"><span className="confidence-value font-mono font-semibold">{data.agent.confidence}%</span><span>Low confidence</span></div>
          <div className="confidence-meter mt-2" role="meter" aria-label="Matching confidence" aria-valuemin={0} aria-valuemax={100} aria-valuenow={data.agent.confidence}><div className="confidence-meter-fill" /></div>
          <Chip tone="warning" className="node-tag mt-3">Should have been caught</Chip>
        </div>}
        {(review || (data.outcome !== "success" && data.outcome !== "warning")) && <div className="node-actions flex items-center justify-between gap-2 px-1">
          {data.outcome !== "warning" && data.outcome !== "success" ? <span className="node-status" role="status">{labels[data.outcome]}</span> : <span />}
          {review && <Button variant={data.outcome === "warning" ? "warning" : "destructive"} size="sm" className="node-review nodrag nopan w-fit rounded-full px-3" aria-label={`${data.agent.name}: ${review}`} onClick={(e) => { e.stopPropagation(); if (data.agent) data.onInspect(data.agent); }}>{review}</Button>}
        </div>}
      </div>
    </> : <div className="space-y-1.5 px-2 pb-2">
      {data.kind === "queue" ? queuedInvoices.map(invoice => <InsetRow key={invoice.id} className={invoice.legit ? "text-success" : data.paused ? "text-warning" : "text-foreground"}>
        <p className="font-mono">{invoice.id}</p><p className="mt-1 text-muted-foreground">{invoice.legit ? "Not a duplicate · Safe to release" : data.paused ? "Paused" : "Queued"}</p>
      </InsetRow>) : <>
        <InsetRow><p className="font-mono">INV-4821</p><p className="mt-1 text-muted-foreground">Paid Oct 29 · $12,480</p></InsetRow>
        {data.paidAgain && <InsetRow className="bg-destructive/10 text-destructive"><p className="font-mono">INV-4821-A</p><p className="mt-1">Paid again · $12,480</p></InsetRow>}
      </>}
    </div>}
    {data.outgoing && <Handle type="source" position={sidePositions[data.outgoing]} id="outgoing" />}
  </div>;
}

function StringEdge(props: EdgeProps) {
  // Outward unit normals of each port's card edge.
  const normals = { [Position.Left]: [-1, 0], [Position.Right]: [1, 0], [Position.Top]: [0, -1], [Position.Bottom]: [0, 1] } as const;
  const [snx, sny] = normals[props.sourcePosition];
  const [tnx, tny] = normals[props.targetPosition];
  const { sourceX: sx, sourceY: sy, targetX: tx, targetY: ty } = props;
  const arrow = 10;
  // Stroke stops at the arrow's base; the arrow fills the last 10px to the card edge.
  const ex = tx + tnx * arrow, ey = ty + tny * arrow;
  const reach = Math.min(160, Math.max(40, Math.hypot(ex - sx, ey - sy) * 0.4));
  // Last control point sits on the target normal, so the end tangent is perpendicular to the edge.
  const path = `M ${sx},${sy} C ${sx + snx * reach},${sy + sny * reach} ${ex + tnx * reach},${ey + tny * reach} ${ex},${ey}`;
  const active = props.data?.['active'] === true;
  const state = props.data?.['state'];
  const stateClass = state === "success" ? "flow-string-success" : state === "warning" ? "flow-string-warning" : state === "failed" ? "flow-string-failed" : "";
  const markerId = `curve-arrow-${props.id}`;
  const label = props.data?.['label'];
  const labelX = (sx + 3 * (sx + snx * reach) + 3 * (ex + tnx * reach) + ex) / 8;
  const labelY = (sy + 3 * (sy + sny * reach) + 3 * (ey + tny * reach) + ey) / 8;
  return <><g className={`flow-string ${active ? "flow-string-active" : ""} ${stateClass}`}>
    <defs><marker id={markerId} viewBox="0 -5 10 10" refX="0" refY="0" markerWidth="10" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto"><path d="M 0,-5 L 10,0 L 0,5 Z" className="flow-string-arrow" /></marker></defs>
    <BaseEdge id={props.id} path={path} markerEnd={`url(#${markerId})`} />
    {active && <path d={path} className="flow-string-pulse" />}
  </g>{typeof label === "string" && <EdgeLabelRenderer><div className={`flow-edge-label nodrag nopan ${state === "failed" ? "text-destructive" : props.data?.['warning'] ? "text-warning" : "text-foreground"}`} style={{ transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)` }}>{label}</div></EdgeLabelRenderer>}</>;
}
const nodeTypes = { inspection: InspectionNode };
const edgeTypes = { string: StringEdge };
const positions = [{ x: 0, y: 0 }, { x: 400, y: 0 }, { x: 800, y: 0 }, { x: 800, y: 390 }, { x: 400, y: 390 }, { x: 0, y: 390 }];
const fitOptions = { padding: 0.04, maxZoom: 1 };
const ids = ["queue", ...agents.map(a => a.id), "output"];

function CanvasControls({ onReset }: { onReset: () => void }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  return <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded border border-border bg-card p-1">
    <IconButton label="Zoom out" icon={Minus} onClick={() => zoomOut({ duration: 150 })} />
    <span className="w-12 text-center font-mono text-2xs text-muted-foreground">{Math.round(zoom * 100)}%</span>
    <IconButton label="Zoom in" icon={Plus} onClick={() => zoomIn({ duration: 150 })} />
    <IconButton label="Fit flow" icon={Maximize} onClick={() => fitView({ ...fitOptions, duration: 250 })} />
    <IconButton label="Reset layout" icon={RotateCcw} onClick={onReset} />
  </div>;
}
export function InvestigationCanvas(props: { replay: ReplayFlow | null; paused: boolean; onInspect: (agent: Agent) => void }) {
  return <ReactFlowProvider><Canvas {...props} /></ReactFlowProvider>;
}
function Canvas({ replay, paused, onInspect }: { replay: ReplayFlow | null; paused: boolean; onInspect: (agent: Agent) => void }) {
  const initialized = useNodesInitialized();
  const fitted = useRef(false);
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!initialized || fitted.current) return;
    const frame = requestAnimationFrame(() => { fitView(fitOptions); fitted.current = true; });
    return () => cancelAnimationFrame(frame);
  }, [initialized, fitView]);
  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>(ids.map((id, i) => ({ id, type: "inspection", position: positions[i] ?? { x: 0, y: 0 }, data: { kind: i === 0 ? "queue" : i === 5 ? "output" : "agent", agent: agents[i - 1], outcome: "pending", detail: "", paused, paidAgain: false, onInspect } })));
  const bounds = nodes.map(node => ({ ...node.position, width: node.measured?.width ?? (node.id === "matching" ? 340 : 280), height: node.measured?.height ?? 250 }));
  const connections = flowConnections(bounds);
  const visibleNodes = nodes.map((node, i) => {
    const outcome = nodeOutcome(i - 1, replay);
    const combined = replay?.rule === "combined";
    const detail = outcome === "pending" ? "Awaiting invoice" : outcome === "running" ? "INV-4821-A · $12,480" : i === 2 ? combined ? "Possible duplicate of INV-4821" : "62%, handed off without a flag" : i === 3 && combined ? "Duplicate check failed · Payment held" : i === 4 && combined ? "Blocked by Policy" : agents[i - 1]?.summary ?? "";
    return { ...node, data: { ...node.data, incoming: connections[i - 1]?.target, outgoing: connections[i]?.source, outcome: i === 0 ? "pending" as const : i === 5 ? (nodeOutcome(3, replay) === "success" ? "success" as const : "pending" as const) : outcome, detail, paused, onInspect, paidAgain: hasNewReceipt(replay) } };
  });
  const edges: Edge[] = ids.slice(0, -1).map((source, i) => {
    const state = handoffOutcome(i - 1, replay);
    const label = i === 1 ? "Passed extracted fields" : i === 2 ? state === "failed" ? "Duplicate flagged" : "Handed off without a flag" : i === 3 && state !== "failed" ? "Approved for payment" : undefined;
    return { id: `string-${i}`, source, target: ids[i + 1] ?? "output", sourceHandle: "outgoing", targetHandle: "incoming", type: "string", data: { active: replay?.phase === "handoff" && replay.index === i - 1, state, label, warning: i === 2 } };
  });
  return <div className="investigation-canvas relative min-h-0 flex-1" aria-label="Invoice investigation canvas">
    <ReactFlow nodes={visibleNodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={fitOptions} minZoom={0.1} maxZoom={1.8} nodeExtent={[[-1800, -1200], [3000, 2200]]} translateExtent={[[-2200, -1600], [3400, 2600]]} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false} nodeDragThreshold={4} onNodeDragStop={(_, dragged) => setNodes(current => {
        const size = (n: FlowNode) => ({ width: n.measured?.width ?? (n.id === "matching" ? 340 : 280), height: n.measured?.height ?? 250 });
        const others = current.filter(n => n.id !== dragged.id).map(n => ({ ...n.position, ...size(n) }));
        const position = resolveOverlap({ ...dragged.position, ...size(dragged) }, others);
        return current.map(n => n.id === dragged.id ? { ...n, position } : n);
      })} proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      <CanvasControls onReset={() => {
        setNodes(current => current.map((node, i) => ({ ...node, position: positions[i] ?? node.position })));
        requestAnimationFrame(() => fitView({ ...fitOptions, duration: 300 }));
      }} />
    </ReactFlow>
  </div>;
}