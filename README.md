# Backstop — Invoice Run Insight

A frontend-only prototype for finance teams investigating AI-agent invoice payments. Explore individual invoice runs, inspect agent evidence, fix a duplicate rule, and replay the workflow without making real payments.

## Features

- Runs table with contextual investigation and viewing actions.
- Draggable, pannable, zoomable React Flow canvas: invoice queue, Extraction, Matching, Policy, Payment, and receipts.
- Run-specific mock purchase orders, agent steps, confidence, and payment evidence.
- Duplicate investigation for `INV-4821-A`, including the original `INV-4821` payment.
- Editable duplicate rule, simulated rule test, sequential replay, and payment hold.
- Pause two similar queued invoices while keeping a legitimate invoice safe to release.
- Shared session activity with undoable rule and pause changes.
- Reduced-motion support and contextual connector-caption tooltips.

## Local development

Requires a current Node.js release and Bun.

```sh
bun install
bun run dev
```

Use the localhost URL printed by Vite.

```sh
bun run test       # Regression tests
bun run build     # Production build
```

## Stack

React 19, TypeScript, TanStack Start and Router, Vite, Tailwind CSS v4, React Flow, Radix UI, Sonner, Tabler icons, and Vitest.

## Code organization

| Location | Responsibility |
| --- | --- |
| `src/routes/` | Runs, individual run views, Rules, and Activity |
| `src/lib/mock-data.ts` | Original invoice alert, run list, rules, and duplicate-agent evidence |
| `src/lib/mock-runs.ts` | Run-specific historical agents, purchase orders, and receipts |
| `src/lib/prototype-state.ts` | Pure reducer for shared rule, pause, activity, and undo state |
| `src/lib/replay-flow.ts` | Sequential simulated agent outcomes and payment holds |
| `src/lib/canvas-layout.ts` | Canvas layout, camera timing, and cross-row curve |
| `src/lib/edge-caption.ts` | Collision-aware captions anchored near connectors |
| `src/components/InvestigationCanvas.tsx` | Nodes, edges, camera, and fixed canvas controls |
| `src/components/InvestigationPanels.tsx` | Evidence, rule editing, and queued-invoice panels |
| `src/components/system/` | Shared interface atoms |
| `src/styles.css` | Theme and canvas design tokens |
| `src/test/` | State, replay, routing, geometry, and provider tests |

## Prototype boundaries

All records and receipts are mock data. Completed-run replays verify simulated payment processing; they do not create additional payments. Only the duplicate scenario can end in “Paid again” or “Duplicate caught,” depending on the currently saved rule. State is held in the root React provider for the current session and resets on a full page reload. There is no database, authentication, payment integration, or backend service.

## Lovable and GitHub

[Open this project in Lovable](https://lovable.dev/projects/57444f79-9c56-42a7-a183-e1f87381cc7c).

Lovable manages commits and two-way repository sync. Select the intended synced branch in **Project settings → Git**; changes reach `main` through sync when it is the selected branch. Changes from another branch must be merged into `main` on GitHub. Avoid rewriting synced branch history.
