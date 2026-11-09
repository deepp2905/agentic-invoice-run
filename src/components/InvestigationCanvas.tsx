import { useMemo } from "react";
import { Background, BackgroundVariant, BaseEdge, Handle, Position, ReactFlow, ReactFlowProvider, getBezierPath, useNodesState, useReactFlow, useViewport, type Edge, type EdgeProps, type Node, type NodeProps } from "@xyflow/react";
import { Check, CircleDashed, Grip, LoaderCircle, Maximize, Minus, Plus, SkipForward, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { agents, type Agent } from "@/lib/mock-data";
import { queuedInvoices } from "@/lib/prototype-state";
import { nodeOutcome, type NodeOutcome, type ReplayFlow } from "@/lib/replay-flow";

type FlowData = { kind: "agent" | "queue" | "output"; agent?: Agent | undefined; outcome: NodeOutcome; detail: string; paused: boolean; paidAgain: boolean; onInspect: (agent: Agent) => void };
type FlowNode = Node<FlowData, "inspection">;
const icons = { pending: CircleDashed, running: LoaderCircle, success: Check, warning: AlertTriangle, failed: X, skipped: SkipForward };
const labels = { pending: "Waiting", running: "Running…", success: "Successful", warning: "Warning", failed: "Held for review", skipped: "Skipped · Not paid" };

function InspectionNode({ data }: NodeProps<FlowNode>) {
  const Icon = icons[data.outcome];
  return <div className={`inspection-node outcome-${data.outcome}`}>
    <Handle type="target" position={Position.Left} id="left" />
    <Handle type="target" position={Position.Top} id="top" />
    <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
      <span className="text-xs font-semibold uppercase">{data.agent?.name ?? (data.kind === "queue" ? "Queue" : "Output tray")}</span>
      <Grip className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>
    {data.agent ? <>
      <Button variant="ghost" className="nodrag h-auto w-full justify-start rounded-none px-4 py-4 text-left" aria-label={`${data.agent.name} station`} onClick={() => { if (data.agent) data.onInspect(data.agent); }}>
        <span className="flex w-full flex-col gap-2">
          <span className="flex items-baseline justify-between"><span className="font-mono text-3xl">{data.agent.confidence}%</span><span className="text-[10px] font-normal text-muted-foreground">CONFIDENCE</span></span>
          <span className="whitespace-normal text-xs font-normal leading-relaxed text-muted-foreground">{data.detail}</span>
        </span>
      </Button>
      <div className="node-status flex items-center gap-2 border-t border-border px-4 py-3 text-xs" role="status"><Icon className={`h-3.5 w-3.5 ${data.outcome === "running" ? "motion-safe:animate-spin" : ""}`} />{labels[data.outcome]}</div>
    </> : <div className="space-y-2 p-4">
      {data.kind === "queue" ? queuedInvoices.map(invoice => <div key={invoice.id} className={`border px-3 py-2 ${invoice.legit ? "border-primary/40 text-primary" : data.paused ? "border-warning/40 text-warning" : "border-border"}`}>
        <p className="font-mono text-xs">{invoice.id}</p><p className="mt-1 text-[10px]">{invoice.legit ? "Not a duplicate · Safe to release" : data.paused ? "Paused" : "Queued"}</p>
      </div>) : <>
        <div className="border border-border px-3 py-3"><p className="font-mono text-xs">INV-4821</p><p className="mt-1 text-[10px] text-muted-foreground">Paid Oct 29 · $12,480</p></div>
        {data.paidAgain && <div className="border border-destructive px-3 py-3 text-destructive"><p className="font-mono text-xs">INV-4821-A</p><p className="mt-1 text-[10px]">Paid again · $12,480</p></div>}
      </>}
    </div>}
    <Handle type="source" position={Position.Right} id="right" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="source" position={Position.Left} id="out-left" />
    <Handle type="target" position={Position.Right} id="in-right" />
  </div>;
}

function StringEdge(props: EdgeProps) {
  const [path] = getBezierPath({ ...props, curvature: 0.55 });
  const active = props.data?.['active'] === true;
  return <g className={`flow-string ${active ? "flow-string-active" : ""}`}>
    <BaseEdge id={props.id} path={path} />
    {active && <path d={path} className="flow-string-pulse" />}
  </g>;
}
const nodeTypes = { inspection: InspectionNode };
const edgeTypes = { string: StringEdge };
const positions = [{ x: 0, y: 150 }, { x: 310, y: 50 }, { x: 620, y: 150 }, { x: 930, y: 50 }, { x: 930, y: 400 }, { x: 560, y: 430 }];
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
  const visibleNodes = nodes.map((node, i) => {
    const outcome = nodeOutcome(i - 1, replay);
    const combined = replay?.rule === "combined";
    const detail = outcome === "pending" ? "Awaiting invoice" : outcome === "running" ? "INV-4821-A · $12,480" : i === 2 ? combined ? "Possible duplicate of INV-4821" : "62%, handed off without a flag" : i === 3 && combined ? "Duplicate check failed · Payment held" : i === 4 && combined ? "Blocked by Policy" : agents[i - 1]?.summary ?? "";
    return { ...node, data: { ...node.data, outcome: i === 0 || i === 5 ? "pending" as const : outcome, detail, paused, onInspect, paidAgain: replay?.phase === "complete" && !combined } };
  });
  const edges = useMemo<Edge[]>(() => ids.slice(0, -1).map((source, i) => ({ id: `string-${i}`, source, target: ids[i + 1] ?? "output", sourceHandle: i === 3 ? "bottom" : i === 4 ? "out-left" : "right", targetHandle: i === 3 ? "top" : i === 4 ? "in-right" : "left", type: "string", data: { active: replay?.phase === "handoff" && replay.index === i - 1 } })), [replay]);
  return <div className="investigation-canvas relative min-h-0 flex-1" aria-label="Invoice investigation canvas">
    <ReactFlow nodes={visibleNodes} edges={edges} onNodesChange={onNodesChange} nodeTypes={nodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.15 }} minZoom={0.25} maxZoom={1.8} nodeExtent={[[-1800, -1200], [3000, 2200]]} translateExtent={[[-2200, -1600], [3400, 2600]]} nodesConnectable={false} edgesReconnectable={false} elementsSelectable={false} nodeDragThreshold={4} proOptions={{ hideAttribution: true }}>
      <Background variant={BackgroundVariant.Dots} gap={24} size={1} />
      <CanvasControls />
    </ReactFlow>
  </div>;
}