# ModuCraft Interior Studio — isolated development build

This is a new, isolated Studio workspace under `interior-studio/`. It does not replace or modify the existing ERP quotation engine or the legacy `studio/` iframe.

## Run
Open `index.html` in a modern browser, or serve this directory with any static HTTP server. No build step or third-party runtime dependency is required.

## Implemented in this increment
- Multi-room project shell with room categories, dimensions and survey status.
- 2D plan, wall A elevation and schematic isometric 3D preview from one room model.
- Starter furniture modules (base, wall, tall/pantry, loft) and site elements.
- Editable dimensions, wall association, finish colour and delete.
- Room duplicate, local persistence, undo/redo and JSON project export.
- Material board fields, customer decision log and a customer presentation/print preview.
- Basic validation for dimensions, out-of-room placement and module overlap.
- Strict same-origin postMessage handshake for catalogue/project messages.

## Explicitly not implemented / not release-ready
- Live ERP catalogue fetch and validated module placement adapter.
- Existing ERP customer/project/quotation adapter, rates, GST, discounts and payment workflow.
- Production-grade interactive 3D renderer, full arbitrary wall geometry, openings in the wall model, all-wall elevation editing.
- Drag/drop placement, snapping, resize handles, appliance/clearance rules and advanced collision detection.
- Furniture detail drawing package, onsite execution drawing package, complete schedules and PDF pack.
- Customer e-signature / approval authority, revision immutability, multi-user sync, offline conflict resolution.
- No factory manufacturing, panel cutting list, CNC, nesting or manufacturing BOM features.

The 3D view is a schematic isometric preview, not photorealistic rendering. Starter furniture is clearly generic and must not be represented as ERP catalogue data. The project stores locally in the browser; it is not synchronized to production ERP.

## Safety boundary
Development only. Do not deploy as production, connect production credentials, or merge into `main` until the ERP adapter, security review, browser QA and end-to-end acceptance scenario pass.
