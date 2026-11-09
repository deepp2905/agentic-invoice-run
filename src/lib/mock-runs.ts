import { agents, runs, type Agent } from "@/lib/mock-data";
import { queuedInvoices } from "@/lib/prototype-state";

export interface RunDetail {
  id: string;
  vendor: string;
  amount: string;
  date: string;
  po: string;
  receipt: string;
  duplicate: boolean;
  agents: Agent[];
  queue: typeof queuedInvoices;
}

// Historical records stay separate from the saved rule and the replay simulation.
const completedRecords = [
  { id: "INV-4821", po: "PO-7710", receipt: "PAY-10291", confidence: [98, 97, 99, 98], purchase: "Office supplies", approval: "Finance lead approval recorded" },
  { id: "INV-4790", po: "PO-7684", receipt: "PAY-10264", confidence: [99, 98, 99, 99], purchase: "Freight services", approval: "Within standard payment approval limit" },
  { id: "INV-4766", po: "PO-7649", receipt: "PAY-10231", confidence: [97, 96, 99, 98], purchase: "Facilities maintenance", approval: "Within standard payment approval limit" },
];

function completedAgents(run: (typeof runs)[number], record: (typeof completedRecords)[number]): Agent[] {
  const { id, vendor, amount, date } = run;
  const { po, receipt, purchase, approval, confidence } = record;
  return [
    { id: "extraction", name: "Extraction", status: "completed", confidence: confidence[0] ?? 98,
      documents: [`Invoice ${id} PDF`], summary: `Read ${id} for ${amount} from ${vendor}.`,
      steps: ["Received invoice PDF from AP inbox", `Extracted invoice number: ${id}`, `Verified vendor: ${vendor}`, `Verified invoice total: ${amount}`],
      evidence: [{ label: "Invoice number", value: id }, { label: "Vendor", value: vendor }, { label: "Amount", value: amount }], handoff: "Passed extracted fields" },
    { id: "matching", name: "Matching", status: "completed", confidence: confidence[1] ?? 97,
      documents: [`Invoice ${id}`, po], summary: `Matched ${purchase.toLowerCase()} to ${po} on vendor, amount and line items.`,
      steps: [`Located ${po} for ${vendor}`, `Verified ${purchase.toLowerCase()} line items`, `Confirmed purchase order total: ${amount}`, "No earlier payment found for this invoice and purchase order", "Passed verified match to Policy"],
      evidence: [{ label: "Matched PO", value: po }, { label: "Purchase", value: purchase }, { label: "Matched amount", value: amount }, { label: "Earlier payment at processing time", value: "None" }], handoff: "Passed verified PO match" },
    { id: "policy", name: "Policy", status: "completed", confidence: confidence[2] ?? 99,
      documents: [`Invoice ${id}`, "Duplicate rule", po], summary: "No earlier invoice payment found; all policy checks passed.",
      steps: ["Checked payment history before this run", "No prior invoice number or vendor + amount + PO match found", "Confirmed purchase order match", approval],
      evidence: [{ label: "Duplicate check", value: "No prior payment" }, { label: "PO", value: po }, { label: "Approval", value: approval }, { label: "Result", value: "Passed" }], handoff: "Approved for payment" },
    { id: "payment", name: "Payment", status: "completed", confidence: confidence[3] ?? 98,
      documents: ["Approval record", receipt], summary: `Paid ${amount} to ${vendor}; receipt ${receipt}.`,
      steps: ["Verified payment authorization", "Added invoice to payment batch", `Paid ${amount} to ${vendor}`, `Recorded receipt ${receipt}`],
      evidence: [{ label: "Amount paid", value: amount }, { label: "Payee", value: vendor }, { label: "Paid at", value: date }, { label: "Receipt", value: receipt }] },
  ];
}

export const runDetails: Record<string, RunDetail> = Object.fromEntries(runs.map(run => {
  const record = completedRecords.find(item => item.id === run.id);
  return [run.id, { ...run, po: record?.po ?? "PO-7710", receipt: record?.receipt ?? "PAY-10348", duplicate: !record,
    agents: record ? completedAgents(run, record) : agents, queue: record ? [] : queuedInvoices }];
}));

export function getRunDetail(id: string): RunDetail | undefined {
  return Object.hasOwn(runDetails, id) ? runDetails[id] : undefined;
}