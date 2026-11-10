export type AgentStatus = "completed" | "warning";

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  confidence: number;
  documents: string[];
  summary: string;
  steps: string[];
  evidence: { label: string; value: string }[];
  handoff?: string;
}

export const alert = {
  invoice: "INV-4821",
  amount: "$12,480",
  vendor: "Harbor Office Supply",
  runId: "INV-4821-A",
};

export const runs = [
  { id: "INV-4821-A", vendor: "Harbor Office Supply", amount: "$12,480", date: "Nov 7, 2026 09:14" },
  { id: "INV-4821-B", vendor: "Harbor Office Supply", amount: "$12,480", date: "Waiting" },
  { id: "INV-4821-C", vendor: "Harbor Office Supply", amount: "$12,480", date: "Waiting" },
  { id: "INV-4821-D", vendor: "Harbor Office Supply", amount: "$3,150", date: "Waiting" },
  { id: "INV-4821", vendor: "Harbor Office Supply", amount: "$12,480", date: "Oct 29, 2026 15:02" },
  { id: "INV-4790", vendor: "Northline Logistics", amount: "$3,215", date: "Oct 27, 2026 11:40" },
  { id: "INV-4766", vendor: "Cedar Facilities", amount: "$7,900", date: "Oct 24, 2026 08:22" },
  { id: "INV-4741", vendor: "Summit Packaging", amount: "$1,940", date: "Oct 21, 2026 10:05" },
];

export const rules = [
  { id: "duplicate", name: "Duplicate check", detail: "Blocks payment when the invoice number exactly matches a previously paid invoice.", lastChanged: "Oct 2, 2026", usedIn: 12, whatItDoes: "Stops the Policy agent from approving an invoice already paid." },
  { id: "confidence", name: "Match confidence threshold", detail: "Flags invoices when the PO match confidence falls below 80%.", lastChanged: "Sep 18, 2026", usedIn: 12, whatItDoes: "Sends low-confidence PO matches to a person before Policy runs." },
  { id: "limit", name: "Vendor approval limit", detail: "Requires a prepared approval record for invoices above $10,000.", lastChanged: "Oct 9, 2026", usedIn: 12, whatItDoes: "Holds large invoices until an approval record exists." },
  { id: "late", name: "Late payment alert", detail: "Alerts the finance lead when an invoice passes its due date unpaid.", lastChanged: "Aug 30, 2026", usedIn: 12, whatItDoes: "Notifies you so overdue invoices are paid on time." },
] as const;

export const agents: Agent[] = [
  {
    id: "extraction",
    name: "Extraction",
    status: "completed",
    confidence: 96,
    documents: ["Invoice PDF"],
    summary: "Read invoice number INV-4821-A.",
    steps: [
      "Received invoice PDF from AP inbox",
      "Extracted invoice number: INV-4821-A",
      "Extracted vendor: Harbor Office Supply",
      "Extracted total: $12,480.00",
    ],
    evidence: [
      { label: "Invoice number", value: "INV-4821-A" },
      { label: "Vendor", value: "Harbor Office Supply" },
      { label: "Amount", value: "$12,480.00" },
    ],
    handoff: "Passed extracted fields",
  },
  {
    id: "matching",
    name: "Matching",
    status: "warning",
    confidence: 62,
    documents: ["Invoice INV-4821-A", "PO-7710"],
    summary: "Matched to PO-7710 with low confidence.",
    steps: [
      "Searched open POs for Harbor Office Supply",
      "Matched to PO-7710 on vendor and amount",
      "Noted invoice number differs from earlier INV-4821 on the same PO",
      "Confidence lowered to 62%",
      "Handed off to Policy without a flag",
    ],
    evidence: [
      { label: "Matched PO", value: "PO-7710" },
      { label: "Earlier invoice on PO", value: "INV-4821 (paid Oct 29)" },
      { label: "Flag raised", value: "None" },
    ],
    handoff: "Handed off without flag",
  },
  {
    id: "policy",
    name: "Policy",
    status: "completed",
    confidence: 90,
    documents: ["Invoice INV-4821-A", "Duplicate rule"],
    summary: "Duplicate check passed on exact match only.",
    steps: [
      "Ran duplicate invoice check",
      "Compared INV-4821-A against paid invoices",
      "No exact match found, check passed",
      "Approval threshold rule applied",
    ],
    evidence: [
      { label: "Rule", value: "Duplicate invoice check (exact match)" },
      { label: "Compared value", value: "INV-4821-A" },
      { label: "Result", value: "Passed" },
    ],
    handoff: "Approved for payment",
  },
  {
    id: "payment",
    name: "Payment",
    status: "completed",
    confidence: 88,
    documents: ["Approval record", "Payment batch"],
    summary: "Prepared approval and paid.",
    steps: [
      "Prepared approval record",
      "Added to payment batch",
      "Paid $12,480.00 to Harbor Office Supply",
    ],
    evidence: [
      { label: "Amount paid", value: "$12,480.00" },
      { label: "Payee", value: "Harbor Office Supply" },
      { label: "Paid at", value: "Nov 7, 2026 09:14" },
    ],
  },
];
