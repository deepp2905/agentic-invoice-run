import { useEffect } from "react";
import { Background, BackgroundVariant, BaseEdge, Handle, MarkerType, Position, ReactFlow, ReactFlowProvider, getBezierPath, useNodesState, useReactFlow, useUpdateNodeInternals, useViewport, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { ArrowUpRight, Check, CircleDashed, GripVertical, LoaderCircle, Maximize, Minus, Plus, SkipForward, AlertTriangle, X } from "lucide-react";
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

function InspectionNode({ id, data }: NodeProps<FlowNode>) {
  const Icon = icons[data.outcome];
  const updateNodeInternals = useUpdateNodeInternals();
  useEffect(() => { updateNodeInternals(id); }, [id, data.incoming, data.outgoing, updateNodeInternals]);
  return <div className={`inspection-node outcome-${data.outcome}`}>
    {data.incoming && <Handle type="target" position={sidePositions[data.incoming]} id="incoming" className="connection-target" />}
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <span className="flex items-center gap-2 text-xs font-semibold"><GripVertical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />{data.agent ? titles[data.agent.id] : data.kind === "queue" ? "Invoice queue" : "Payment receipts"}</span>
      {data.agent && <Icon className={`h-4 w-4 shrink-0 node-status ${data.outcome === "running" ? "motion-safe:animate-spin" : ""}`} aria-label={labels[data.outcome]}><title>{labels[data.outcome]}</title></Icon>}
    </div>
    {data.agent ? <>
      <div className="flex flex-col gap-3 p-4">
        <span className="text-[10px] uppercase text-muted-foreground">{data.agent.name}</span>
          <span className="flex items-baseline justify-between"><span className="font-mono text-3xl">{data.agent.confidence}%</span><span className="text-[10px] font-normal text-muted-foreground">CONFIDENCE</span></span>
          <p className="min-h-10 text-xs leading-relaxed text-muted-foreground">{data.detail}</p>
          {data.outcome !== "success" && <span className="node-status text-xs" role="status">{labels[data.outcome]}</span>}
          <Button variant="outline" size="sm" className={`nodrag nopan w-fit rounded-full px-3 shadow-none ${data.outcome === "warning" ? "border-warning/50 text-warning" : data.outcome === "failed" ? "border-destructive/50 text-destructive" : ""}`} aria-label={`${data.agent.name}: ${data.outcome === "warning" ? "Review match" : data.outcome === "failed" ? "Review hold" : "View details"}`} onClick={() => { if (data.agent) data.onInspect(data.agent); }}>{data.outcome === "warning" ? "Review match" : data.outcome === "failed" ? "Review hold" : "View details"}<ArrowUpRight className="h-3.5 w-3.5" /></Button>
      </div>
    </> : <div className="space-y-2 p-4">
      {data.kind === "queue" ? queuedInvoices.map(invoice => <div key={invoice.id} className={`border px-3 py-2 ${invoice.legit ? "border-primary/40 text-primary" : data.paused ? "border-warning/40 text-warning" : "border-border"}`}>
        <p className="font-mono text-xs">{invoice.id}</p><p className="mt-1 text-[10px]">{invoice.legit ? "Not a duplicate · Safe to release" : data.paused ? "Paused" : "Queued"}</p>
      </div>) : <>
        <div className="border border-border px-3 py-3"><p className="font-mono text-xs">INV-4821</p><p className="mt-1 text-[10px] text-muted-foreground">Paid Oct 29 · $12,480</p></div>
        {data.paidAgain && <div className="border border-destructive px-3 py-3 text-destructive"><p className="font-mono text-xs">INV-4821-A</p><p className="mt-1 text-[10px]">Paid again · $12,480</p></div>}
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
    <BaseEdge id={props.id} path={path} markerEnd={props.markerEnd} />
    {active && <path d={path} className="flow-string-pulse" />}
  </g>;
}
const nodeTypes = { inspection: InspectionNode };
const edgeTypes = { string: StringEdge };
const positions = [{ x: 0, y: 100 }, { x: 310, y: 75 }, { x: 620, y: 110 }, { x: 930, y: 80 }, { x: 1240, y: 105 }, { x: 1550, y: 85 }];
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