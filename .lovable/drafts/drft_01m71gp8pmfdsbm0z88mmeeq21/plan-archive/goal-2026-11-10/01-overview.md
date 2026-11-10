## Goal
Turn Rules and Activity from read-only lists into working pages tied to the run investigation, still using sample data only (no backend).

## Rules page
1. **Rule cards with live status** — each rule shows what it checks, whether it is on, and when it last changed. The duplicate rule shows its current check ("Exact invoice number" or "Vendor + amount + PO").
2. **Edit in place** — "Edit rule" on the duplicate rule opens the same rule editor used on the run page, so saving from either place gives the same result.
3. **Test against past runs** — a "Test rule" button checks every sample run and lists which would be held (for example, INV-4821-A held, others pass).
4. **Turn rules on or off** — a switch per rule; turning one off is recorded in Activity and can be undone.
5. **Linked runs** — each rule lists the runs it affected, with a link to open that run's canvas.

## Activity page
1. **Filters** — All, Rule changes, Pauses, Replays.
2. **Richer entries** — each entry names the run or rule it touched, shows before/after for rule changes ("Exact number → Vendor + amount + PO"), and links to the run.
3. **Undo with confirmation** — keep the existing undo rules (only the latest change of each kind), and show what will change before undoing.
4. **Starter history** — a few earlier sample entries (e.g. the original INV-4821 payment, the INV-4821-A second payment) so the page tells the duplicate story even before any action.
5. **Unread badge** — the sidebar shows a count of new entries since Activity was last opened.
