# ModuCraft Interior Design Studio — Requirements & Gap Closure Specification

**Repository:** `chandragoopt-oss/moducraft-app`  
**Development branch:** `feature/interior-studio`  
**Status:** Development specification; implementation and QA remain outstanding  
**Release boundary:** Do not merge into `main` or alter the running online ERP without explicit owner approval.  
**Business reference:** Module Studio Customer Quotation Guide & Project Terms (9 pages).

## 1. Purpose and product boundary

The Interior Design Studio is the design and technical-documentation workspace within ModuCraft. It must provide one consistent project model from which the designer can create room layouts, furniture designs, material specifications, technical drawings, onsite execution drawings and structured quantity data.

The existing ModuCraft ERP remains the commercial and project system of record for customers, quotations, rates, payments, invoices, procurement and project administration. Design Studio must integrate through stable project/room/module references and must not duplicate or silently overwrite ERP master data.

The current development branch is isolated. Keep all work on `feature/interior-studio`. Do not merge, deploy to production, or modify `main` without explicit approval.

## 2. Business requirements derived from the customer guide

The customer guide establishes that:
- The accepted quotation, room-wise BOQ, approved drawings, specifications, approved material/finish selections and written change approvals are to be read together.
- The accepted quotation and BOQ are the primary commercial reference; approved revisions govern where documents conflict.
- Only expressly listed work, modules, quantities, materials, finishes, accessories and services are included.
- Module identity, cabinet/shutter material and colour, dimensions, selected accessories and applicable module image/name/price must be identifiable in the quotation/BOQ.
- Final production dimensions are to be confirmed through site measurement and/or approved drawings.
- Customers review dimensions, layouts, clearances, appliance sizes, service points, module configurations and finishes before final approval.
- Production/procurement dependent on customer approval begins only after written approval.
- Material/finish substitution that materially changes an approved specification requires communication and written approval.
- Changes to layout, dimensions, modules, materials, finishes, accessories, quantities or scope are assessed for feasibility, price and timeline impact; additional/changed work proceeds only after written approval.
- Drawings, designs, 3D views, layouts and BOQ formats prepared by Module Studio are its intellectual property, subject to the customer's project-use permission in the guide.
- Installation inspection, written snag records, room-wise/partial handover and warranty administration are part of the wider project process.

These are source-derived business requirements. The application features below are implementation requirements inferred to support them; they do not alter the commercial terms or decide whether a service is included in a particular quotation.

## 3. Three connected workspaces

### 3.1 Design workspace

Required capabilities:
1. Create and manage multiple rooms per project.
2. Room geometry: rectangular, L-shaped and U-shaped, with editable dimensions in millimetres.
3. Site survey: wall-by-wall dimensions, wall thickness, floor-to-ceiling height, slab/ceiling levels, door/window openings and swing, niches, pillars, beams, projections and other obstructions.
4. Record survey status (preliminary / site-verified), measurement date, surveyor and source notes.
5. Attach site photographs and associate each photo with a room or wall.
6. 2D plan drawing, editing, zoom, pan, selection, dimension display and snapping.
7. Individual wall elevations with accurate openings, furniture and dimensions.
8. Interactive 3D room and furniture visualisation. A schematic/isometric preview is not to be described as full 3D modelling.
9. Module library sourced from existing ModuCraft catalogue data; preserve master IDs, codes, names, category and standard dimensions.
10. Module placement, move, rotate, resize where permitted, duplicate, delete and wall association.
11. Base, wall, tall, loft, corner and other catalogue-supported units.
12. Site structures and openings: doors, windows, niches, pillars, beams and slabs.
13. Parametric module specification panel: overall and component dimensions, construction, board/ply type and thickness, shutter configuration, interior/exterior finish, edge band, hardware, accessories and fixing information.
14. Auto-loft generation with designer-controlled height/depth, alignment and validation; no placeholder button.
15. Material/finish selection with catalogue references, sample images and 3D preview where available.
16. Appliance library and placement, including dimensions, model, installation clearances, ventilation, power and plumbing/service requirements where applicable.
17. Service point coordination for electrical, plumbing and HVAC where included in design scope.
18. Undo/redo backed by actual edit history.
19. Reliable save, reopen and restore; no silent save failures.
20. Multiple views must use the same underlying geometry and dimensions.

### 3.2 Drawing workspace

Provide a Drawing Manager with on-demand generation. The designer must be able to generate a single module, selected modules, one room or the complete project. Furniture drawings and onsite execution drawings are separate packages.

#### A. Furniture technical / manufacturing drawing package

Generate professional, dimensioned sheets containing applicable views:
- Plan/top view.
- Front and rear elevations.
- Left/right side elevations.
- Internal construction and compartment view.
- Sections and enlarged details.
- Shutter, drawer and hardware positioning.
- Exploded/assembly view where construction data supports it.
- Wall fixing, floor fixing and installation details where specified.

Each drawing must identify:
- Project, room, wall and module.
- Module name, catalogue code and stable master ID.
- Drawing number, revision, date and status.
- Overall dimensions (W × H × D) in mm.
- Component/panel dimensions where available from parametric construction rules.
- Material code, name, grade and thickness.
- Interior/exterior finish, laminate/veneer/acrylic/glass details and finish code.
- Edge-band specification and edge application.
- Hardware and accessory identifiers/specifications.
- Quantity and installation notes.

Material tags must resolve to actual catalogue records. Example codes such as P01/L01/G01 in this specification are illustrative only; do not create false master records or assign codes without catalogue mapping. Include a material legend on the drawing.

Do not fabricate component cut sizes from overall cabinet dimensions alone. A manufacturing drawing may be labelled production-ready only when the required construction rules, tolerances, joints, hardware clearances and component dimensions are defined and validated. Otherwise label it as a design/detail drawing requiring technical review.

#### B. Onsite execution drawing package

Generate independent sheets for the onsite trades, based on the same room coordinate model:
- Painting: wall-wise areas, surface/finish/colour references and quantity basis.
- False ceiling: reflected ceiling plan, levels, drops, coves, profiles, sections, access panels, cut-outs and slab reference.
- Lighting: fixture locations, types, quantities, wattage/specification, switching groups and circuit references.
- Electrical sockets: point locations, mounting heights, type/rating and appliance association.
- Electrical modules/switchboards: board location, elevation, switch/socket/regulator/control configuration and mounting height.
- Wiring: circuit identification, point-to-circuit schedule, routing intent, cable/specification schedule and DB references where data is supplied.
- Residential split AC: indoor/outdoor unit locations, service clearances, copper pipe route, condensate drain route, sleeve/core-cut provision and dedicated power/isolator point.
- Ceiling fans: centre point, mounting provision, electrical point and clearance coordination.
- Appliance power points and dedicated loads.
- Plumbing/service coordination where the quoted scope requires it.
- Combined site coordination sheet showing furniture, ceiling, lights, electrical points and AC interfaces.

The system must distinguish **design shown**, **included in accepted quotation**, **optional**, **excluded**, **additional work requested**, and **approved additional work**. A drawing element alone must never mark a service as commercially included. This distinction is required because the guide says excluded/optional work is not assumed included merely because it appears in a drawing or discussion.

Electrical, structural, HVAC and other regulated/technical execution details must be marked for verification by the appropriately qualified site professional where required. The application is a coordination/documentation aid, not a substitute for professional site approval.

#### Drawing controls and output

- Generate on demand by module, room, discipline or project.
- Select views/sheets and include/exclude dimensions, material tags and notes.
- A4/A3/A2 page setup, suitable scale, readable lineweights, dimension styles and title blocks.
- Module Studio project identity and branding.
- Unique drawing number and revision sequence.
- PDF export and print-ready output; retain structured source data for regeneration.
- Preview before issue.
- Drawing status: Draft / For Customer Review / Approved for Production / Superseded.
- Regenerate only affected sheets after a design change, while retaining prior issued revisions.
- Never silently mutate an approved or issued drawing.

### 3.3 Project output workspace

Design data should feed:
- Room-wise BOQ data.
- Module and accessory schedules.
- Thickness-wise board/plywood requirements.
- Laminate, acrylic, veneer and finish schedules.
- Hardware, fittings, edge-band and accessory schedules.
- Glass and aluminium schedules.
- Lighting/electrical/AC/ceiling/painting quantities where those scopes are configured.
- Site requirement / order sheet.
- Manufacturing and installation schedules.
- Room-wise drawing register and approval register.
- Project summary and the existing ERP's applicable project sheets.

Quantity calculations must be traceable to the actual selected module, construction rule, material, accessory and quantity. Do not use room-area-only approximations for cabinet manufacturing requirements. Changes to design or material selections must recalculate affected outputs and identify the changed lines.

## 4. Material and approval lifecycle

Each material/finish/accessory selection must support:
- Proposed selection.
- Customer-selected option.
- Final approved selection.
- Approval identity, date/time and revision reference.
- Catalogue item ID/code and specification snapshot.
- Substitution request and written approval record.

The project must preserve the approved specification snapshot even if a master catalogue item later changes. Material availability/substitution workflows must not silently replace approved selections.

## 5. Revision and change-control workflow

Every project design has a revision history. Minimum states:
- Working Draft.
- Issued for Customer Review.
- Customer Changes Requested.
- Approved.
- Approved for Production.
- Superseded.

For each revision, retain:
- Changed room/module/site element/material/service point.
- Before and after values.
- Designer and timestamp.
- Reason/change note.
- Affected drawings and generated schedules.
- Estimated quantity/BOQ impact, when calculation data is available.
- Customer approval record and supporting written evidence.
- Status of affected drawing and output revisions.

An approved revision is immutable. A new edit creates a new revision. The application must not claim written customer approval unless the approval evidence has actually been recorded.

## 6. Commercial scope flags

For each work category and optional service, support:
- Included in accepted quotation.
- Optional / separately priced.
- Excluded.
- Additional work requested.
- Awaiting feasibility/price/timeline assessment.
- Approved additional work.
- Declined / not proceeding.

The quotation/ERP remains authoritative for commercial inclusion and approved price. Design Studio may display and coordinate scope flags but must not unilaterally change quotation value, tax, payment schedule or contractual scope.

## 7. ERP integration contract

- Existing ERP remains source of truth for clients, projects/quotation identity, module/material/accessory master data, approved rates and commercial records.
- Design Studio must consume existing master lists and preserve stable IDs/codes/names/specifications. No duplicate catalogue or manually recreated master list.
- Studio-owned data includes room/site geometry, placements, design-specific configuration, drawing revisions and design calculation inputs.
- Sync must be explicit, validated, idempotent and version-aware.
- Detect stale catalogue/project versions and conflicts before write.
- Never overwrite unrelated quotation/project records or silently replace customer-approved values.
- Existing online ERP must continue operating during development and migration.
- Backend migration is a separate planned activity; it must not block isolated Design Studio work or be used as a reason to change production services prematurely.

## 8. Wider project lifecycle integration

The guide's installation and handover requirements imply downstream ERP/project features:
- Installation checklist for supplied furniture and applicable hardware.
- Room-wise completion and partial handover.
- Snag list with room/location, description, photos, date and status.
- Rectification tracking.
- Final handover record and approved drawing archive.
- Warranty/service records in ERP, linked to project and handover date.

These are ERP/project operations, not a reason to overload the 3D editor. Design Studio should provide the room/module/drawing references needed by those workflows.

## 9. Acceptance criteria and QA gates

Do not mark the Design Studio release-ready until the following have been tested:

### Geometry and design
- Rectangular, L-shaped and U-shaped room dimensions remain correct through shape changes, save and reload.
- Wall, opening, pillar, beam and niche positions/dimensions are consistent in plan, elevation and 3D.
- Furniture placement, rotation, dimension editing, snapping and collision/clearance warnings behave predictably.
- All dimensions are converted and displayed correctly in mm; no cm/mm or height/depth swaps.
- Catalogue module ID/code and dimensions survive add, edit, save and reload.
- No hardcoded fallback catalogue item is silently presented as the live full catalogue.

### Persistence and history
- Save/reopen preserves project, room, geometry, modules, materials, accessories, service points and revisions.
- Undo/redo restores actual prior states.
- Save failures are visible and recoverable.
- Multiple rooms remain isolated and correctly associated with the project.

### Drawings
- Furniture drawings match the saved model and selected revision.
- Material tags resolve to selected catalogue specifications.
- No production-ready label when construction data is incomplete.
- Onsite sheets use the same room coordinates and show consistent fixture/service positions.
- Each drawing has project identity, unique number, revision, date, scale, units, legend and status.
- Issued/approved revisions remain unchanged after subsequent edits.
- PDF export and print layout are checked at target paper sizes.

### Scope and approvals
- Included/optional/excluded/additional work states are distinct.
- A design element does not automatically become a quoted item.
- Customer approval and change records are auditable.
- Approved specifications are retained as snapshots.

### ERP and regression
- Master data is fetched from existing ERP and IDs/codes are preserved.
- Sync is tested against a safe test/staging dataset first.
- Conflicts and stale versions are detected; no destructive overwrite.
- Existing quotation, BOQ, payment and project workflows pass regression tests.
- The running online ERP is not disrupted.

## 10. Development order

1. Stabilise the existing design data model, unit conventions and multi-room persistence.
2. Complete core 2D geometry, elevations, properties, editing history and save/reopen.
3. Replace schematic-only preview with a genuinely interactive 3D scene suitable for furniture/material visualisation.
4. Complete catalogue-backed parametric furniture and material/accessory configuration.
5. Add site survey and appliance/service coordination.
6. Build on-demand furniture technical drawing generator.
7. Build separate onsite execution drawing generator.
8. Add drawing register, revision control, scope flags and customer approval evidence.
9. Generate traceable BOQ/material/site requirement outputs.
10. Integrate live ERP master lists and safe output sync.
11. Add handover/snags linkage and complete end-to-end regression.

## 11. Known implementation gaps from the latest repository review

The latest available review identified basic room geometry, plan rendering, basic module/site-element placement, wall elevations and a schematic SVG isometric preview. It also identified incomplete or unverified areas including full interactive 3D, live catalogue coverage, Auto Loft generation, real Undo/Redo, material catalogue integration, reliable save/reload, furniture manufacturing drawings, onsite execution drawings, approval/revision workflow and end-to-end BOQ/ERP integration.

These are review findings, not a fresh browser QA result. Reinspect and test each area before changing its status. Do not claim a feature works solely because a control or label exists.

## 12. Release and reporting rules

- Work only on `feature/interior-studio` until explicit merge approval.
- No production deployment or main-branch changes without approval.
- Keep the running ERP operational.
- Report actual commits, files changed, tests executed and test results.
- Clearly separate implemented, code-present-but-untested, blocked and not-started work.
- Do not claim bug-free; report passed tests and known limitations.
- Launch target previously specified by the owner: 19 November 2026, 10:00 AM IST. Prioritise a tested, safe deliverable over unsupported completion claims.
