# Senior QA report — first isolated Studio increment

## Test scope
Static review of the isolated `interior-studio/index.html` implementation and a browser-oriented acceptance checklist. This report does not claim a browser execution run: the connected GitHub workflow has no verified browser runtime in this session.

## Automated checks to run in CI / local browser
1. Open the app with empty storage; confirm a single default Kitchen room is created.
2. Add a second room; switch between rooms; verify room data isolation.
3. Duplicate a room; verify copied modules receive new IDs and decisions are not copied.
4. Add base, wall, tall and loft modules; verify dimensions and default wall.
5. Edit each numeric property; verify plan, elevation and 3D use the same saved values.
6. Set zero/negative dimensions; confirm blocker appears.
7. Place two modules with intersecting rectangles; confirm overlap blocker.
8. Place a module beyond room boundary; confirm warning.
9. Change survey status; verify the preliminary-survey warning clears only after explicit verification.
10. Undo and redo room/module/property edits; verify state restoration.
11. Reload the page; verify local project restoration.
12. Export JSON; parse the exported file and verify schemaVersion and room IDs.
13. Record customer decision; verify it is persisted and appears in presentation.
14. Confirm presentation hides editor controls and internal cost fields (none are present in this increment).
15. Send a message from a different origin; confirm it is ignored.
16. Confirm no API calls or writes to ERP are made by this standalone build.

## Known defects / release blockers
- No executable browser automation result is available from this environment.
- Room boundary and overlap checks use axis-aligned rectangles; they are not a complete geometric clash engine.
- The current wall elevation is Wall A only.
- The isometric view is schematic and uses room-corner approximation; not a full 3D scene.
- Catalogue, quotation, approval and drawing packages are not integrated.
- The room settings form accepts valid positive dimensions but does not yet constrain all existing modules after room resize.
- Presentation output is a preview/print page, not a fully designed signed customer pack.

## QA disposition
**NOT APPROVED for production or customer sign-off.** Suitable only as an isolated functional foundation / developer preview. Before production: execute real browser tests, implement ERP adapters, complete the drawing and document workflows, and pass the complete v1.6 acceptance scenario.


## Checks actually executed during this increment (13 Nov 2026)
- Inline JavaScript parse via V8 `new Function(...)`: **PASS** after correcting an invalid numeric object key in the 3D view title map.
- Static feature-presence checks: **PASS** for multi-room creation, undo/redo handlers, local persistence read/write, validation function, presentation builder, JSON export and same-origin message guard.
- Scope scan: **PASS** — no factory manufacturing/cutting/CNC/nesting features in the new app.
- Code review fixes applied:
  - Rendering now hydrates project/customer/reference fields from the restored local project instead of overwriting restored metadata with initial form defaults.
  - Validation detail list is rendered when the Checks tab opens.
  - Isometric room wall-top coordinates use the canonical room dimensions.
  - Customer decision capture increments the project revision.
- GitHub file read-back: **PASS** after each committed code update.

## Not executed
- No real browser runtime, DOM interaction, screenshot, mobile viewport, browser storage quota, print-to-PDF or cross-tab testing was available through the connected GitHub tool session.
- No Playwright/Cypress/browser CI run was triggered. Do not interpret JavaScript parsing or static checks as an end-to-end test.

- Added a Chromium + Playwright smoke suite at `tests/smoke.mjs` covering fresh start, multi-room creation, module placement, overlap validation, undo/redo, persistence, customer decision capture, presentation and JSON export.
- Added GitHub Actions workflow `.github/workflows/interior-studio-qa.yml` to run the smoke suite on pushes to this feature branch and relevant pull requests.
- Workflow dispatch is not available in the connected GitHub action set, and GitHub reports no workflow run yet. The Playwright suite is therefore **added but not yet executed**.
- Latest inline JavaScript syntax parse after the final fixes: **PASS**.
