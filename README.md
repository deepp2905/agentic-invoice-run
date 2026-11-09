# Invoice Run Insight

Build a clickable prototype of an agent observability tool for a finance team. Dark mode desktop web app, clean and serious, one accent color (teal), high contrast text, generous spacing. Use hardcoded mock data in a local file. No backend.

Context: AI agents process vendor invoices. A duplicate payment just happened and the finance lead must investigate.

Layout: left sidebar with Runs and Rules. Main area is the Run view.

Screen 1, Alert: A banner at the top of the Runs page: "Invoice INV-4821 was paid twice, $12,480. Vendor: Harbor Office Supply." Button: "Investigate".

Screen 2, Run timeline: Clicking Investigate opens the run for INV-4821-A. Show a horizontal timeline of 4 agent cards in order: Extraction, Matching, Policy, Payment. Each card shows status, the documents it used, and a confidence percentage. Show Matching at 62% with a warning marker, and arrows for hand offs between cards. Clicking a card opens a side panel with that agent's steps and the evidence it used.

Mock data:

- Extraction read invoice number INV-4821-A, 96% confidence.

- Matching matched it to PO-7710, confidence 62%, because the invoice number differs from an earlier one. It handed off without a flag.

- Policy has a duplicate rule that only checks exact invoice numbers, so it passed. 90%.

- Payment prepared the approval and paid. 88%.

Keep it simple and polished. Do not add extra features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/57444f79-9c56-42a7-a183-e1f87381cc7c).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
