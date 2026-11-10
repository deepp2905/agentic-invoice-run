import type { LogCategory } from "@/lib/prototype-state";

/** Past activity shown beneath live actions. Read-only: none of it can be undone. */
export type ActivityActor = { type: "agent" | "person"; name: string };
export interface HistoryEntry { id: string; actor: ActivityActor; category: LogCategory; message: string; affects?: string; time: string }

const person: ActivityActor = { type: "person", name: "Neha Hiremath" };
const agent = (name: string): ActivityActor => ({ type: "agent", name });

export const activityHistory: HistoryEntry[] = [
  { id: "h1", actor: agent("Payment agent"), category: "runs", message: "Paid INV-4821-A, $12,480", affects: "Harbor Office Supply · PO-7710", time: "Nov 7, 09:16" },
  { id: "h2", actor: agent("Policy agent"), category: "runs", message: "Passed duplicate check for INV-4821-A", affects: "Exact invoice number check found no match", time: "Nov 7, 09:15" },
  { id: "h3", actor: agent("Matching agent"), category: "runs", message: "Matched INV-4821-A to PO-7710 at 62% confidence", affects: "Handed off without a flag", time: "Nov 7, 09:15" },
  { id: "h5", actor: agent("Payment agent"), category: "runs", message: "Paid INV-4821, $12,480", affects: "Harbor Office Supply · PO-7710", time: "Oct 29, 15:04" },
  { id: "h4", actor: person, category: "runs", message: "Approved INV-4766 for payment", affects: "Cedar Facilities · $7,900", time: "Oct 24, 08:30" },
  { id: "h6", actor: person, category: "rules", message: "Set Vendor approval limit to $10,000", affects: "Applies to invoices above $10,000", time: "Oct 9, 14:12" },
  { id: "h7", actor: person, category: "rules", message: "Turned on Duplicate check", affects: "Exact invoice number only", time: "Oct 2, 11:05" },
];
