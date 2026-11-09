import { useEffect, useRef } from "react";
import { Background, BackgroundVariant, BaseEdge, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, getBezierPath, useNodesInitialized, useNodesState, useReactFlow, useUpdateNodeInternals, useViewport, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, Check, CircleDashed, FileScan, Files, GitCompareArrows, GripVertical, LoaderCircle, Maximize, Minus, Plus, Receipt, ShieldCheck, SkipForward, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents, type Agent } from "@/lib/mock-data";
import { queuedInvoices } from "@/lib/prototype-state";
import { nodeOutcome, type NodeOutcome, type ReplayFlow } from "@/lib/replay-flow";
import { connectionSides, type ConnectionSide } from "@/lib/flow-connections";

type FlowData = { kind: "agent" | "queue" | "output"; agent?: Agent | undefined; outcome: NodeOutcome; detail: string; paused: boolean; paidAgain: boolean; incoming?: ConnectionSide | undefined; outgoing?: ConnectionSide | undefined; onInspect: (agent: Agent) => void };
type FlowNode = Node<FlowData, "inspection">;
const icons = { pending: CircleDashed, running: LoaderCircle, success: Check, warning: AlertTriangle, failed: X, skipped: SkipForward };
const labels = { pending: "Waiting", running: "Running…", success: "Successful", warning: "Warning", failed: "Held for review", skipped: "Skipped · Not paid" };

const sidePositions = { left: Position.Left, right: Position.Right, top: Position.Top, bottom: Position.Bottom };
const titles: Record<string, string> = { extraction: "Read invoice", matching: "Match purchase order", policy: "Check duplicates", payment: "Issue payment" };
const stationIcons: Record<string, typeof FileScan> = { extraction: FileScan, matching: GitCompareArrows, policy: ShieldCheck, payment: Receipt };

function InspectionNode({ id, data }: NodeProps<FlowNode>) {
  const Icon = icons[data.outcome];
  const StationIcon = data.agent ? stationIcons[data.agent.id] ?? FileScan : data.kind === "queue" ? Files : Receipt;
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, data.incoming, data.outgoing, updateNodeInternals]);
  return <div className={`inspection-node outcome-${data.outcome}`}>
    {data.incoming && <Handle type="target" position={sidePositions[data.incoming]} id="incoming" className="connection-target" />}
    <div className="flex h-11 items-center justify-between gap-2 px-3">
      <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold"><GripVertical className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden="true" /><StationIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{data.agent ? titles[data.agent.id] : data.kind === "queue" ? "Invoice queue" : "Payment receipts"}</span>
      {data.agent && <Icon className={`h-3.5 w-3.5 shrink-0 node-status ${data.outcome === "running" ? "motion-safe:animate-spin" : ""}`} aria-label={labels[data.outcome]}><title>{labels[data.outcome]}</title></Icon>}
    </div>
    {data.agent ? <>
      <div className="flex flex-col gap-1.5 px-2 pb-2">
        <div className="rounded-md bg-muted/50 px-2.5 py-2">
          <p className="mb-1 text-[10px] text-muted-foreground">{data.agent.name}</p>
          <p className="min-h-8 text-[11px] leading-relaxed">{data.detail}</p>
        </div>
        <div className="flex h-7 items-center justify-between rounded-md bg-muted/50 px-2.5 text-[10px]"><span className="text-muted-foreground">Confidence</span><span className="font-mono">{data.agent.confidence}%</span></div>
        <div className="flex h-9 items-center justify-between gap-2 px-1">
          {data.outcome !== "success" ? <span className="node-status text-[10px]" role="status">{labels[data.outcome]}</span> : <span />}
          <Button variant="outline" size="sm" className={`nodrag nopan h-7 w-fit rounded-full px-2.5 text-[10px] shadow-none ${data.outcome === "warning" ? "border-warning/50 text-warning" : data.outcome === "failed" ? "border-destructive/50 text-destructive" : ""}`} aria-label={`${data.agent.name}: ${data.outcome === "warning" ? "Review match" : data.outcome === "failed" ? "Review hold" : "View details"}`} onClick={() => { if (data.agent) data.onInspect(data.agent); }}>{data.outcome === "warning" ? "Review match" : data.outcome === "failed" ? "Review hold" : "View details"}<ArrowUpRight className="h-3 w-3" /></Button>
        </div>
      </div>
    </> : <div className="space-y-1.5 px-2 pb-2">
      {data.kind === "queue" ? queuedInvoices.map(invoice => <div key={invoice.id} className={`rounded-md bg-muted/50 px-2.5 py-2 ${invoice.legit ? "text-primary" : data.paused ? "text-warning" : "text-foreground"}`}>
        <p className="font-mono text-[11px]">{invoice.id}</p><p className="mt-1 text-[10px] text-muted-foreground">{invoice.legit ? "Not a duplicate · Safe to release" : data.paused ? "Paused" : "Queued"}</p>
      </div>) : <>
        <div className="rounded-md bg-muted/50 px-2.5 py-2"><p className="font-mono text-[11px]">INV-4821</p><p className="mt-1 text-[10px] text-muted-foreground">Paid Oct 29 · $12,480</p></div>
        {data.paidAgain && <div className="rounded-md bg-destructive/10 px-2.5 py-2 text-destructive"><p className="font-mono text-[11px]">INV-4821-A</p><p className="mt-1 text-[10px]">Paid again · $12,480</p></div>}
      </>}
    </div>}
    {data.outgoing && <Handle type="source" position={sidePositions[data.outgoing]} id="outgoing" />}
  </div>;
}

function StringEdge(props: EdgeProps) {
  const [bezier] = getBezierPath({ ...props, curvature: 0.55 });
  const vertical = Math.abs(props.sourceX - props.targetX) < 20;
  const horizontal = Math.abs(props.sourceY - props.targetY) < 20;
  const path = vertical
    ? `M ${props.sourceX},${props.sourceY} C ${props.sourceX + 50},${props.sourceY + (props.targetY - props.sourceY) / 3} ${props.targetX + 50},${props.targetY - (props.targetY - props.sourceY) / 3} ${props.targetX},${props.targetY}`
    : horizontal
      ? `M ${props.sourceX},${props.sourceY} C ${props.sourceX + (props.targetX - props.sourceX) / 3},${props.sourceY + 40} ${props.targetX - (props.targetX - props.sourceX) / 3},${props.targetY + 40} ${props.targetX},${props.targetY}`
      : bezier;
  const active = props.data?.['active'] === true;
  return <g className={`flow-string ${active ? "flow-string-active" : ""}`}>
    <BaseEdge id={props.id} path={path} {...(props.markerEnd ? { markerEnd: props.markerEnd } : {})} />
    {active && <path d={path} className="flow-string-pulse" />}
  </g>;
}
const nodeTypes = { inspection: InspectionNode };
const edgeTypes = { string: StringEdge };
const positions = [{ x: 0, y: 100 }, { x: 270, y: 80 }, { x: 540, y: 115 }, { x: 810, y: 85 }, { x: 1080, y: 110 }, { x: 1350, y: 90 }];
const ids = ["queue", ...agents.map(a => a.id), "output"];

function CanvasControls() {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const { zoom } = useViewport();
  return <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1 rounded border border-border bg-card p-1">
    <Button variant="ghost" size="icon" aria-label="Zoom out" title="Zoom out" onClick={() => zoomOut({ duration: 150 })}><Minus /></Button>
    <Button variant="ghost" size="icon" aria-label="Fit flow" title="Fit flow" onClick={() => fitView({ padding: 0.15, duration: 250 })}><Maximize /></Button>
    <Button variant="ghost" size="icon" aria-label="Zoom in" title="Zoom in" onClick={() => zoomIn({ duration: 150 })}><Plus /></Button>
    <span className="w-12 text-center font-mono text-[10px] text-muted-foreground">{Math.round(zoom * 100)}%</span>
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
    const frame = requestAnimationFrame(() => { fitView({ padding: 0.15 }); fitted.current = true; });
    return () => cancelAnimationFrame(frame);
  }, [initialized, fitView]);
  const [nodes, , onNodesChange] = useNodesState<FlowNode>(ids.map((id, i) => ({ id, type: "inspection", position: positions[i] ?? { x: 0, y: 0 }, data: { kind: i === 0 ? "queue" : i === 5 ? "output" : "agent", agent: agents[i - 1], outcome: "pending", detail: "", paused, paidAgain: false, onInspect } })));
  const bounds = nodes.map(node => ({ ...node.position, width: node.measured?.width ?? 230, height: node.measured?.height ?? 250 }));
  const connections = bounds.slice(0, -1).map((source, i) => connectionSides(source, bounds[i + 1] ?? source));
  const visibleNodes = nodes.map((node, i) => {
    const outcome = nodeOutcome(i - 1, replay);
    const combined = replay?.rule === "combined";
    const detail = outcome === "pending" ? "Awaiting invoice" : outcome === "running" ? "INV-4821-A · $12,480" : i === 2 ? combined ? "Possible duplicate of INV-4821" : "62%, handed off without a flag" : i === 3 && combined ? "Duplicate check failed · Payment held" : i === 4 && combined ? "Blocked by Policy" : agents[i - 1]?.summary ?? "";
    return { ...node, data: { ...node.data, incoming: connections[i - 1]?.target, outgoing: connections[i]?.source, outcome: i === 0 || i === 5 ? "pending" as const : outcome, detail, paused, onInspect, paidAgain: replay?.phase === "complete" && !combined } };
  });
  const edges: Edge[] = ids.slice(0, -1).map((source, i) => ({ id: `string-${i}`, source, target: ids[i + 1] ?? "output", sourceHandle: "outgoing", targetHandle: "incoming", type: "string", markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 }, data: { active: replay?.phase === "handoff" && replay.index === i - 1 } }));
  return <div className="investigation-canvas relative min-h-0 flex-1" aria-label="Invoice investigation canvas">
    <ReactFlow nodes={visibleNodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.15 }} minZoom={0.25} maxZoom={1.8} nodeExtent={[[-1800, -1200], [3000, 2200]]} translateExtent={[[-2200, -1600], [3400, 2600]]} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false} nodeDragThreshold={4} proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      <CanvasControls />
    </ReactFlow>
  </div>;
}