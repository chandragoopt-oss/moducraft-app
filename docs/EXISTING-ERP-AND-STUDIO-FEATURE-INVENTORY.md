# Existing ModuCraft feature preservation inventory and 3D-first plan

**Baseline reviewed:** `main` (existing ERP / preview) and `feature/interior-studio` (current development branch), 13 November 2026.
**Deadline:** 19 November 2026, 10:00 AM IST.
**Rule:** New Studio must not cause loss of existing ERP, quotation, BOQ, preview, old Design tab or iframe Studio features. Keep the new work isolated until parity, regression and acceptance gates pass.

## 1. Existing application surfaces

There are three related but distinct surfaces in the current repository:

1. **Main ERP** — `index.html`, `app.js`, `custom.js`, `auth.js`, `terms.js`.
2. **Preview / presentation shell** — `preview.html`, `preview-ui.js`, `preview.css`; it loads the same ERP application scripts and adds preview navigation, KPI/Kanban dashboard, theme control and the Design Studio iframe bridge.
3. **Existing Design experiences**:
   - ERP's existing `Design (Old)` tab and its quotation-linked design / BOQ / elevation / perspective / DXF functions in `app.js`.
   - The separate `studio/` iframe launched by the preview shell, with `studio/index.html`, `drawing.js`, `setup.js`, `style.css`.

Do not treat the preview shell as a disposable mock. It is a user-facing way of accessing ERP features and must be regression-tested alongside the main ERP.

## 2. ERP feature inventory to preserve

The following existing areas are visible in the current source and must remain available in the final integrated product:

- Authentication / login, user session, owner/editor/viewer permissions, department access and access sharing.
- Dashboard / Today view, KPI strip, follow-up reminders, Kanban-style overdue/task/quotation/project cards, theme preference and global search.
- Enquiries / lead records and follow-up history.
- Quotations: create, edit, duplicate/revise, save, share/lock, preview/print, customer/project and room records.
- Room-wise BOQ rows, room addition, item/module catalogue, unit / quantity / area-based calculations and custom item rates.
- Pricing modes and rate overrides, module rates, room area rates, package pricing, service lines, discounts, tax/GST, totals and quote snapshots.
- Payment terms / milestones and payment tracking.
- Project management, stages, tasks, vendors, purchase orders and reporting.
- Accessories catalogue, room/module accessory assignment, accessory quantities and accessory cost summaries.
- Ply & hardware estimates, material quantity summaries, hardware brand comparisons and PDF/print output.
- Material, finish, plywood, hardware, room, module and accessory master/settings.
- Invoice generation / GST invoice details and project-linked billing.
- Project daily/site reports, expenses and attached site photos where configured.
- Backup export / import, local persistence, cloud save status and recovery warnings.
- Terms, customer-facing proposal / quotation preview and PDF print flows.

**Preservation rule:** the new Studio must hand design outputs to the existing ERP quotation and material-estimation logic. It must not implement a second competing quotation, GST, payment, invoice, client, project, vendor or master-data system.

## 3. Existing Design (Old) capabilities to preserve or improve

The existing ERP Design tab contains more design engineering than the first new Studio foundation. The following must be carried forward deliberately:

- Room-specific item filtering and room-type-aware module validation.
- Room dimensions and wall-specific geometry, including room walls A/B/C/D.
- 2D plan and wall elevation SVG drawing.
- Interactive wall-based furniture layout, drag/move, keyboard nudge, rotation, duplication, deletion and snapping.
- Synchronized wall elevations and a schematic 3D perspective.
- Camera/viewpoint controls, orbit-like rotation, zoom, fit and full-screen view.
- Module catalogue-backed selection, standard width/height/depth limits and module-specific configuration.
- Module properties: position, width, height, depth, wall, orientation and selected catalogue module.
- Auto-height by module type; base / wall / tall / wardrobe / loft positioning logic.
- Overlap / wall collision and opening clearance checks, free-space detection, filler suggestions and corner-module geometry.
- Door/window/opening and niche placement; pillars, beams, slabs and other site structure objects.
- Per-room handle type, skirting, countertop ply and stone options.
- Carcass ply grade/maker, outer and inner shutter finish, carcass finish, 3D colour, shelves, shelf type, drawer system, LED options and accessory assignment.
- Automatic hardware / accessory quantity derivation, LED length, module-specific accessory fit warnings.
- Auto loft generator: per wall unit or continuous run, shutter / lift-up choice, loft dimensions, corner loft handling, top and side fillers, remove generated lofts.
- Filler placement, corner-unit arm configuration and wall gap suggestions.
- Countertop, skirting and material estimate contribution to existing BOQ.
- DXF export for a room and all rooms, including drawing layers / elevations / 3D solids as documented in the existing UI.
- Existing design-to-quotation mapping and room-level save of module rows, dimensions, site elements and room name.

These functions are the minimum parity checklist, not a claim that each is defect-free. Some need QA and correction before being treated as release-ready.

## 4. Existing iframe Studio capabilities and known gaps

The `studio/` iframe currently provides:
- Quotation/room selection and import of room dimensions and `_fromDS` module rows.
- Rectangle, L-shape and U-shape room outlines.
- Plan rendering and lightweight isometric SVG-like 3D preview.
- Per-wall elevation cards and wall elevation view.
- Module picker fed from ERP catalogue data; module selection, placement and properties.
- Doors, windows, niches, pillars, beams and slabs.
- Dragging modules and site objects; panning and zooming.
- Module/site-element deletion.
- Save message back to preview shell and mapping into existing quotation room rows.

Known limitations found in code review:
- Undo / Redo buttons are placeholder alerts, not implemented history.
- Auto Loft tab is a UI shell; the mature generator is in the ERP Design tab, not the iframe.
- The iframe 3D is a lightweight schematic projection, not a true interactive 3D scene.
- Module placement / dimensions and some property persistence need regression verification.
- Save bridge uses broad `postMessage('*')` and silent catch blocks; harden origin checks and error reporting before production.
- Room shape and geometry coverage is limited; not all room outlines / openings are fully modelled.
- Iframe code and the ERP Design tab are separate implementations; parity must be measured, not assumed.

## 5. New Studio status — honest baseline

The new `interior-studio/` folder currently contains an isolated single-file HTML/JS prototype with multi-room shell, basic plan, Wall A elevation, schematic isometric preview, generic starter modules, basic properties, localStorage, undo/redo, limited checks, material labels and a presentation preview.

It does **not** yet meet the previously agreed React + TypeScript + Vite + Three.js / React Three Fiber architecture, and its 3D is not yet a true 3D editor. Treat it as a disposable/replaceable interaction prototype until the 3D technical spike is accepted. Do not confuse its current view with production-quality 3D.

## 6. 3D-first test and implementation sequence

### Gate 0 — protect and baseline (13 Nov)
- Keep `main`, production ERP and all existing ERP / preview / `studio/` code untouched.
- Record source hashes and feature inventory for both main ERP and preview shell.
- Confirm CI smoke tests do not mistake non-visible canvas objects for lost objects.
- Keep all new 3D work under `interior-studio/` and isolated tests / docs.

### Gate 1 — 3D model contract (13–14 Nov)
Use one canonical project model with stable IDs and millimetre units:
- Room: category, dimensions, wall segments, ceiling, floor levels, openings, columns, beams, niches.
- Module: ERP catalogue ID/code, type, dimensions, position, wall, rotation, elevation, carcass/shutter/accessory specification.
- Surface: countertop / backsplash / skirting / flooring / ceiling / paint as distinct entities.
- Every plan/elevation/3D view must read and write this same model. No canvas-only state.
- Preserve ERP source IDs and distinguish catalogue-backed modules from generic placeholders.

### Gate 2 — actual 3D scene (14–16 Nov)
Prioritize:
- True 3D room shell with correct wall thickness, floor, ceiling height and openings.
- Real furniture carcass volumes with correct mm-to-world scaling, placement, wall association and rotation.
- Separate shutter/facade geometry and visible door type / handle / finish.
- Countertop, backsplash, plinth, loft and filler geometry.
- Site elements: doors, windows, pillars, beams, slabs and niches.
- Camera orbit, pan, zoom, orthographic/perspective and fit-to-room.
- Select objects in 3D; edit properties; verify changes immediately in 2D plan and elevations.
- Material/texture preview and useful lighting; prioritize accurate dimensions and legibility before photorealism.
- Test irregular room boundaries and L/U room geometry after the rectangular baseline is stable.

### Gate 3 — 3D senior QA (16–17 Nov)
Automate and manually verify:
- mm-to-world scale and known test dimensions.
- Wall thickness, room dimensions, ceiling height and floor datum.
- Module size / position / rotation consistency between plan, elevation and 3D.
- Openings and collision clearances.
- Overlap / out-of-bounds / wall attachment checks.
- Camera controls, selection, deselection and property editing.
- Save / reload exact geometry and materials.
- Undo / redo for geometry edits.
- 10 / 50 / 100 object performance and no console errors.
- Desktop and narrow mobile viewport behaviour; WebGL unavailable / context loss fallback.
- Screenshot / visual regression on known reference rooms.
- Export / import round trip.

### Gate 4 — parity regression (17–18 Nov)
Run existing main ERP and preview shell acceptance checks:
- Login, role permissions, dashboard, enquiry, quotation, room BOQ, rate/tax/payment, projects, vendors/PO, accessories, ply/hardware estimate, invoice, reports, PDF/print, backup/restore.
- Launch old Design tab and iframe Studio; verify their current workflows still work in the baseline branch.
- Compare old Design outputs with new Studio outputs on the same test room.
- Verify design quantities flow to existing ERP estimates and quotation without changing rates or financial records.
- Any missing existing feature blocks integration.

### Gate 5 — release candidate / decision (18–19 Nov before 10:00 AM)
- Freeze scope; fix only release-blocking defects.
- Run complete regression twice from a clean browser profile.
- Confirm saved design and approved quote survive reload and a second user/session.
- Produce test evidence, known limitations and rollback instructions.
- Do not merge or deploy unless acceptance gates pass and explicit approval is given.

## 7. 3D acceptance criteria

A 3D test pass requires all of the following:
1. A known rectangular room and a known L-shaped room render with correct dimensions.
2. At least one catalogue-backed base, wall, tall and loft module renders with exact physical dimensions.
3. Doors, windows, pillars, beams and countertop appear in the correct positions.
4. Moving, resizing or rotating a module updates plan, elevation and 3D together.
5. Shutter finish changes without changing carcass geometry/material.
6. Save, reload, undo and redo restore the exact scene.
7. Collision / opening clearance warnings match the 2D model.
8. 3D can be navigated and selected without browser console errors or unacceptable performance.
9. A test project can be exported and imported without losing IDs or dimensions.
10. Existing ERP / preview workflows remain unaffected.

## 8. Explicit scope boundary

Keep design-level furniture technical drawings and separate onsite execution drawings in the product scope as previously agreed. Do not add factory manufacturing engineering: no panel cutting lists, CNC drilling, nesting, manufacturing BOM, factory work orders or machine planning. Material and accessory quantity estimates remain allowed for site/commercial use.

## 9. Current CI finding to resolve

The first Playwright run exposed a test assertion error: the smoke test checked for plan objects while the Checks tab was active, so those SVG/DOM objects were not mounted. This was a test sequencing defect, not evidence that the undo feature failed. The smoke test has been corrected to return to Plan before asserting undo/redo. The rerun must pass before the prototype's basic workflow is called browser-tested.
