# ModuCraft Upgrade Sprint — Source Reconciliation Baseline

**Date:** 23 November 2026  
**Repository:** `chandragoopt-oss/moducraft-app`  
**Sprint branch:** `upgrade-sprint/knowledge-and-feature-consolidation` (isolated; not merged/deployed)  
**Baseline:** `feature/interior-studio`  
**Sources:** Master Knowledge Base v2; Developer Handover v4.1; Existing-vs-Target Feature Register v4.1; Source Traceability v4; topicwise archive; Claude archive review; feature branches and existing repository code.

## Controlling guardrails
- Preserve the existing ERP and its records. No replacement or competing quotation engine.
- ERP owns customers, projects, quotations, rates, discounts, GST, labour, transport, margin, payments, invoices and commercial approvals.
- Studio owns measured geometry, modules, materials, design revisions, validation, ceiling, drawings and design outputs; integrate through a reviewed ERP adapter.
- Keep this sprint isolated. No main/live modifications, merge, release or deployment without Owner approval.
- Status is evidence-based: **source-present** is not **runtime-tested** or **production-ready**.
- No factory manufacturing scope: cutting lists, CNC, nesting, production BOM/work orders, machining/assembly engineering, machine utilization and factory planning remain excluded.
- Technical export requirement: DXF; DWG export is not required. Older DWG-import/reference discussions are historical.
- Online ERP sync is target; offline is not a requirement for the new Studio. Preserve the legacy offline artifacts, do not delete them.
- Each furniture unit receives its own detail sheet; do not group identical units into a single sheet.
- No client-facing message, quote release, purchase order, design approval, deployment or irreversible operation without human approval.

## Repository source and branch reconciliation
- `main`: existing ERP baseline.
- `feature/interior-studio`: isolated Studio increment with documented requirements, inventory, ceiling specification, QA checklist and smoke test assets.
- `feature/module-studio-presentation-builder`: separate presentation-builder feature branch. Treat its assets as additive candidates; inspect and integrate carefully rather than overwrite.
- Existing ERP design logic, standalone iframe Studio and newer isolated Interior Studio are distinct surfaces and must be parity-reviewed.

## Preservation inventory
Preserve/regression-check these existing capabilities:
- Login/session and user/department access controls (security enforcement remains unverified).
- Dashboard, KPI strip, task/follow-up cards, search/navigation and preview shell.
- Enquiries/CRM, follow-up history and client/project records.
- Quote lifecycle: create/edit/duplicate/revise/save/share/lock/preview/print.
- Room-based BOQ, module catalogue, quantity/area calculations, pricing modes, rates/overrides, discount, GST/tax, payment terms and snapshots.
- Materials/finishes, plywood, hardware/accessories catalogue and calculations; module-specific assignments and estimates.
- Design tab: room/wall geometry, plan, elevations, placement, nudge, drag, rotation, snap, corner/filler/loft concepts, openings, doors/windows/niches, pillars/beams/slabs, clearances and collision checks (feature coverage varies by implementation).
- 3D/perspective renderer and fallback; must not claim photorealistic readiness without device/runtime evidence.
- Ceiling design (partial and build-specific; A/B reported library styles; reconcile).
- DXF, PDF/print and technical-detail output (quality validation required).
- Vendors, purchase orders, project/task stages, site reports/photos, expenses, receipts/payables, invoices, handover, audit/revisions and customer portal features where present.
- Backup/import/export, terms, brochures and presentation shell.

## Target capability gaps (consolidated, prioritized)
### P0 — safety, continuity, core workflow
1. Confirm current live/backend architecture and data boundaries; source snapshot cannot verify server-side behavior.
2. Server-side identity, role/tenant enforcement, secrets remediation, cross-account tests and audit integrity.
3. Canonical client/project/room/design IDs and versioned design model; controlled ERP adapter.
4. Preserve and regression-test quote lifecycle, pricing, tax, payment, invoice, materials, access and data exports.
5. Geometry safety: measured room/wall segments, openings/site obstacles, clamping, collision/clearance validation, consistent plan/elevation/3D and save/reopen.
6. Phone-first survey capture: wall dimensions, openings, columns/beams/services, photographs, notes and explicit measurement status; phone is survey/operations, not full CAD modelling.
7. Acceptance gate: one end-to-end synthetic project with persistence, role, revisions, calculations and exports.

### P1 — design completion, documentation, operational linkage
1. Consolidate design editors and module catalogues without losing useful Build A/B/C capabilities.
2. Professional desktop CAD workspace: tool rail, canvas/viewport, properties/library panel, visible contextual controls, keyboard/touch/accessibility.
3. Canonical room geometry supporting rectangular and non-rectangular rooms, openings and site objects.
4. Material/PBR model, separate shutter/drawer/door geometry, realistic renderer; prove in browser/device tests.
5. Parametric ceiling styles fit to surveyed rooms and clash-aware around AC, curtains, wardrobes/tall units, beams, pillars, lights and services; generate reflected ceiling plan, sections and schedules.
6. Furniture detail sheets per unit; separate onsite execution coordination pack; DXF/PDF quality checks and dimensional validation.
7. Customer presentation assembly, material boards/docket, scope/assumptions and customer approval/revision workflow.
8. Procurement: vendor catalogues, RFQs, comparisons, PO draft/approval, delivery/receipts and substitution audit.
9. Project execution, site reporting, snagging, handover, warranty and after-sales workflow.
10. Mobile/responsive survey, site reports and approvals; dedicated phone workflow rather than scaled desktop CAD.

### P2 — AI and efficiency
- AI enquiry summary, site-note transcription, draft designs/quotes, render prompt generation, customer Q&A/RAG, brochure/presentation assembly, suggestions and reporting.
- AI outputs are drafts; deterministic code governs pricing, quantity, tax, geometry validation and approval status.
- AI actions are scoped, logged and approval-controlled; no agent access presumed.

## Commercial rules captured from source register
- Two base quotation methods: Per Sqft and Module Rate.
- Factory Finish is optional, not a third pricing method; percentage applies only to eligible carcass + shutter + labour subtotal, not hardware/accessories.
- Latest reported sqft rates: Kitchen ₹1,800/sq ft; other rooms ₹1,500/sq ft (implementation unverified).
- Factory Finish default reported as 12% within a source range of 10–15%; implementation and eligibility must be audited.
- Preserve configurable GST; apply GST after eligible factory-finish calculation according to ERP tax configuration.
- Quote-specific rate/rule snapshots preserve issued versions.
- Mode-dependent hardware rules and brand catalogue require reconciliation; do not silently remove Hettich/Ebco/Local/Hafele/Quba or legacy brands.
- Countertop: stone only when explicitly opted; otherwise countertop ply. Appliances bill only when opted.
- Labour, transport, margin, GST, payments and invoicing remain ERP-owned.
- No manufacturing/cutting outputs.

## Evidence and QA status
- Existing repo code and feature branches have been fetched and inspected via GitHub connector; source tree is not equivalent to runtime verification.
- Feature-branch Studio README and QA report explicitly describe the new isolated Studio as a functional foundation, not production-ready.
- Smoke tests and GitHub Actions workflow are present in the feature branch, but no fresh browser CI execution has been verified in this session.
- Static parse and source-level checks reported in historical QA are retained as historical evidence, not fresh tests.
- Backend provider, persistence, auth, permissions, backup/restore, cross-account security, mobile QA, print/PDF, DXF and end-to-end integration remain unverified.
- Source archives have coverage gaps (including incomplete raw Claude/DeepSeek coverage and prototype source-review limitations); do not present the entire historical corpus as exhaustively verified.

## Sprint execution checklist
- [ ] Read and reconcile master knowledge base, feature register, handover, source traceability, supporting texts and topic archive.
- [ ] Inspect current repo branch trees, feature diffs and presentation-builder branch.
- [ ] Build additive parity map for Studio A/B/C, existing ERP Design, standalone Studio and presentation builder.
- [ ] Close verified low-risk regressions with tests.
- [ ] Build requirements/architecture/QA documentation into repo docs.
- [ ] Run available CI and browser tests; record what did and did not execute.
- [ ] Prepare owner-review PR; no merge/deploy.
