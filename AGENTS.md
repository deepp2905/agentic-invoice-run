<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Prototype architecture
- Keep cross-page prototype actions in a root-mounted React context with a pure reducer so navigation preserves state and undo/replay remain testable without persistence.
- Keep prototype context identity in a separate browser-safe module cached in Vite hot data, so live-updated consumers remain attached to the mounted root provider.
- Use React Flow for the investigation canvas and a pure replay state machine for node outcomes and connector handoffs; keep viewport movement separate from fixed page controls.
- Use two left-to-right rows and a bottom-to-top elbow for the cross-row handoff; keep layout and timing constants in a tested browser-safe module.
- Animate the React Flow viewport transform through cancellable frame interpolation; user gestures cancel camera ownership, and reduced motion skips movement.
- Read the synchronous root action-state accessor for each replay; derive idle results from the saved rule so route remounts cannot show a stale payment result.
- Reserve a separate bottom control band outside the React Flow viewport, and resolve edge-label clearance against measured node bounds in screen pixels.
- Jointly derive distinct incoming/outgoing edge centers from neighboring node bounds through a pure geometry helper; keep stable handle IDs so dragging preserves coherent ordered flow without overlapping ports.
- Render arrow markers inside each custom edge with automatic SVG orientation so arrowheads follow the actual curve tangent and share its outcome styling.
- Shared UI atoms (Chip, Notice, InsetRow, Surface, IconButton, Avatar, Hint) live in src/components/system; pages compose them and never hardcode colors, radii or font sizes — tokens in src/styles.css are the single source.
