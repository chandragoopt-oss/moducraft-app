# MODUCRAFT INTERIOR STUDIO — Specification Addendum D, v1.6

**Repository:** `chandragoopt-oss/moducraft-app`  
**Development branch:** `feature/interior-studio`  
**Specification status:** Consolidated development requirements; implementation and end-to-end QA remain outstanding unless explicitly verified.  
**Parent specifications:** ModuCraft v1.4 Master Specification and Addendum C v1.5.  
**Business references:** Module Studio Customer Quotation Guide & Project Terms; Specification Addendum Drafting.pdf (10 pages).  
**Release boundary:** Do not merge into `main`, deploy, or modify the running online ERP without explicit owner approval.

---

## 1. Product vision and scope boundary

ModuCraft Interior Studio is the design, customization, visualization and technical-documentation module within the existing ModuCraft ERP.

It must let designers create multi-room interior projects, configure furniture modules and finishes, visualize designs in 2D/elevations/3D, coordinate onsite services, generate customer-facing and technical detail documents, calculate design quantities and connect the result to the existing quotation and project workflows.

**The existing ModuCraft ERP remains the business system of record.** Reuse its customers, projects, quotations, rates, materials, accessories, suppliers, invoices, payments and commercial workflows. Do not create a duplicate quotation engine, duplicate ERP, or duplicate master catalogues.

### 1.1 Explicitly included

- Room-specific interior design and reusable room/category templates.
- Advanced 2D plans, wall elevations, sections and interactive 3D visualization.
- Furniture module placement and customization.
- Door, shutter, facade, glass and aluminium customization.
- Countertop and surface customization.
- Material, hardware and accessory selection and detail schedules.
- Site measurement and existing-condition records.
- Appliance and onsite service coordination.
- Furniture technical/detail drawings for design review, customer approval, site coordination and installation reference.
- Separate onsite execution/coordination drawing package.
- Design quantities, estimated material/accessory quantities and commercial costing inputs.
- Integration with the existing quotation/proposal and ERP workflows.
- Revision, approval, validation and audit history.

### 1.2 Explicitly excluded — no factory manufacturing system

Do not build or represent the Studio as a factory-production engineering application. Exclude:

- Panel cutting lists or board optimization cut lists.
- CNC drilling, machining or toolpath generation.
- Sheet nesting or optimization.
- Factory production planning or scheduling.
- Manufacturing BOM or factory work orders.
- Machine utilization.
- Manufacturing wastage optimization.
- Factory machining/assembly process engineering.

Material quantities, estimated accessory quantities, countertop area, design specifications and commercial costing remain in scope because they support quotations, customer detail sheets and project planning. They must not be presented as factory cutting/production outputs.

**Terminology rule:** use “Furniture Technical Drawings”, “Furniture Detail Drawings” or “Furniture Design Documentation”. Do not label these as factory manufacturing drawings. A furniture detail drawing may show overall dimensions, elevations, sections, material marks, shutter configuration, hardware locations and installation references, but must not generate panel cutting dimensions, CNC instructions or factory production documentation.

---

## 2. Business and customer-document requirements

The customer quotation guide and addendum establish the following business rules:

- The accepted quotation, room-wise BOQ, approved drawings, specifications, approved material/finish selections and written change approvals must remain consistent.
- Only expressly listed work, modules, quantities, materials, finishes, accessories and services are included in the accepted commercial scope.
- Module identity, cabinet/shutter material and colour, dimensions, selected accessories and applicable module name/image/price must be identifiable where applicable.
- Final site dimensions must be recorded and confirmed through site measurement and/or approved drawings.
- Customers must be able to review layouts, dimensions, clearances, appliance sizes, service points, module configurations and finishes before approval.
- Material or finish substitutions that materially change an approved specification require communication and approval.
- Changes to layouts, dimensions, modules, materials, finishes, accessories, quantities or scope must be assessed for feasibility, price and timeline impact and approved before proceeding.
- Design and quotation revisions must preserve the exact approved snapshot.
- Installation inspection, snag records, partial/room-wise handover and warranty administration belong to the wider ERP/project lifecycle.

These rules govern system behavior; the application must not silently decide that a service is included in a quotation merely because it appears in a drawing.

---

## 3. Workspace architecture

Provide three connected workspaces using one project data model.

### 3.1 Design Workspace

#### Room and interior category engine

Support multiple rooms of different categories in one project, including:

- Kitchen: base, wall, tall, island, pantry, appliance and related units.
- Bedroom: wardrobe, loft, bed, headboard, bedside, dresser and study.
- Living room: TV units, partitions, crockery, display and storage.
- Bathroom: vanity, mirror cabinet, storage and glass partition.
- Study and office: workstations, tables, cabinets and shelving.
- Foyer, pooja, utility, dining, commercial, retail and other spaces.

Requirements:
- Each room has a category and optional subcategory.
- Each category can have its own module/accessory library, templates and default finishes.
- Templates are editable and reusable.
- Room-level material/finish defaults are supported.
- Users can create custom categories and templates.
- Changing a category must not silently delete or corrupt existing design information.

#### Site survey and room geometry

- Rectangular, L-shaped, U-shaped, irregular and angled-wall room geometry.
- Editable dimensions in millimetres.
- Wall-by-wall measurements and wall thickness.
- Floor-to-ceiling height, slab level, floor level and ceiling levels.
- Doors, windows, opening directions, niches, pillars, beams, projections and obstructions.
- False ceiling, bulkheads and other architectural elements.
- Preliminary versus site-verified survey status, survey date and surveyor.
- Site photographs linked to project, room and wall.
- Record plumbing, electrical, AC and other existing service points.
- Compare preliminary dimensions with final site-verified dimensions.

#### 2D, elevation, section and 3D design

- Direct room drawing and wall editing.
- 2D plan with zoom, pan, select, snap, dimension and editing tools.
- Individual wall elevations.
- Section view where design data supports it.
- Interactive 3D room/furniture visualization, not merely a static isometric illustration.
- Camera orbit/rotation, zoom, pan and lighting controls.
- Material textures and realistic finish previews where assets exist.
- Synchronized selection and geometry between plan, elevations, sections and 3D.
- A change to a module must update all related views.
- Module identity must persist across views.
- Dimensions may be edited directly on the drawing.
- Changes must update the underlying project model, not just the canvas.
- Import/export of common project drawings where supported and validated.

#### Furniture module library and placement

- Search and filter the existing ModuCraft catalogue.
- Preserve catalogue IDs, codes, names, categories, dimensions and source references.
- Support placement, move, resize where permitted, rotate, duplicate, align, snap and delete.
- Support suitable wall or floor placement and wall association.
- Support catalogue-supported base, wall, tall, loft, corner and other modules.
- Properties panel for dimensions, location, height, depth, orientation and configuration.
- Auto-loft generation with editable settings and validation; no nonfunctional placeholder controls.
- Undo/redo, autosave and crash recovery.
- Reliable save, reopen and restore for all rooms and their design information.

#### Module configuration

Each module must support applicable design attributes:
- Overall width, height and depth.
- Internal layout/compartments and visible design details.
- Carcass and interior/exterior finish references.
- Board/material type and thickness as specification data.
- Shutter/facade configuration.
- Edge finish, hardware and accessories.
- Handles/handleless profile.
- Installation and fixing reference details.
- Appliance or service interface, where applicable.

Do not infer factory panel cut sizes or manufacturing construction details from overall module dimensions.

---

## 4. Door, shutter and facade customization

Each shutter/facade must be independently configurable from the carcass.

Support applicable options:
- Single, double and multiple shutters.
- Hinged, sliding, folding and lift-up opening styles.
- Overlay, half-overlay and inset styles.
- Laminate, acrylic, veneer, PU, membrane and other catalogue-supported finishes.
- Clear, tinted, fluted and other glass types; mirror where applicable.
- Aluminium-frame shutters and profile/finish options.
- Shaker, routed, fluted, ribbed and CNC-pattern appearance options (visual/design specification only; no CNC output).
- Handles, knobs, J-profile, G-profile, Gola and handleless options.
- Door swing direction and opening clearance.
- Individual shutter dimensions, colour, texture and finish.
- Shutter-level hardware and accessories.

Acceptance requirements:
- Each shutter has its own configuration record.
- Changing shutter finish does not change carcass finish.
- Glass and aluminium configurations have separate specifications.
- Shutter selection appears correctly in 2D elevations, detail sheets and 3D.
- Detail sheets show the actual selected shutter specification.

---

## 5. Countertop and surface customization

Countertops are independent editable design elements and may be assigned to an individual module or continuous run.

Support:
- Granite, quartz, marble, solid surface and other catalogue-supported materials.
- Brand, colour, finish and thickness.
- Straight, bevelled, bullnose and other supported edge profiles.
- Sink and hob cutouts represented in the design.
- Backsplash and wall upstand.
- Waterfall ends and side panels.
- Overhangs and supporting structure as design references.
- Joints and corner configurations.
- Sink/basin placement.
- Wall and module junctions.

Calculate design/commercial surface quantities using documented geometry and calculation rules. Include countertop material, thickness, edge, cutouts and finish in detail sheets and quotation inputs where applicable. Do not generate factory cutting/templating instructions.

---

## 6. Materials, hardware and accessories

Use the existing ERP catalogues as the source of truth. Expand the existing data and presentation rather than creating duplicate catalogues.

Each available record should support, where the source data exists:
- Unique item ID and code.
- Item name and category.
- Brand/manufacturer and product/model/SKU.
- Image or texture.
- Colour and finish.
- Material grade and thickness.
- Dimensions and technical specifications.
- Unit of measure and estimated quantity.
- Room and module references.
- Supplier/purchase reference where available.
- Warranty/product documentation where available.
- Customer-facing description.
- Existing ERP rate and commercial reference where authorized.

Support relevant categories such as boards/plywood, laminates, acrylic, veneer, glass, aluminium profiles, hardware, hinges, channels, handles, baskets, mechanisms, countertop surfaces, lighting and other existing ERP lists.

The Studio must distinguish:
1. Selected specification.
2. Estimated quantity.
3. Quoted commercial amount.
4. Actual supplier/product confirmation, if available.

Never display an unconfirmed brand/model as finalized. Preserve master IDs and catalogue snapshots used by an approved design.

---

## 7. Drawing Workspace and Drawing Manager

Provide on-demand drawing generation. The designer may generate an individual item, selected items, a room, a discipline package or the complete project. Maintain two separate drawing packages.

### 7.1 Furniture Technical / Detail Drawing Package

This is design and project documentation, **not factory manufacturing documentation**.

Generate applicable views and details:
- Plan/top view.
- Front and rear elevations.
- Left and right side elevations.
- Internal design/compartment view.
- Sections and enlarged design details.
- Shutter, drawer-front and hardware-position details.
- Exploded visual/assembly reference only where supported by design data.
- Wall/floor fixing and installation reference details where specified.

Every sheet should identify:
- Client/project, room, wall and furniture/module.
- Module name, catalogue code and stable ID.
- Drawing number, revision, date and status.
- Overall dimensions (W × H × D) in mm.
- Visible design dimensions and key internal dimensions where defined.
- Material marks linked to actual catalogue records: material name, grade, thickness, finish and code.
- Carcass and shutter finish separately.
- Glass/aluminium/profile details where applicable.
- Hardware/accessory names and references.
- Quantity and relevant site/installation notes.
- Material legend and drawing notes.

Material tags must resolve to real catalogue records. Any example tags such as P01/L01/G01 are illustrative only; do not invent catalogue records or codes.

Do not include panel cutting lists, cut-size schedules, CNC data, nesting, machining instructions, factory BOM or production routing. Do not label these drawings “production-ready manufacturing drawings”.

### 7.2 Separate Onsite Execution / Coordination Drawing Package

Generate independent trade/discipline sheets using the same room coordinate model:

- **Painting layout:** wall-wise surfaces/areas, colour and finish references, quantity basis.
- **False ceiling:** reflected ceiling plan, slab/ceiling levels, drops, coves, profiles, sections, access panels and cut-outs.
- **Lighting layout:** fixture positions, type, quantity, wattage/specification, switching groups and circuit references.
- **Electrical socket layout:** point positions, mounting heights, types/ratings and appliance associations.
- **Electrical module/switchboard layout:** board positions, elevations, switch/socket/regulator/control configuration and mounting heights.
- **Wiring coordination:** circuit IDs, point-to-circuit schedule, routing intent and cable/DB references where supplied.
- **Residential split AC:** indoor/outdoor locations, clearances, copper pipe route, condensate drain route, sleeve/core-cut provisions and dedicated power/isolator point.
- **Ceiling fan layout:** centre positions, mounting provisions, electrical points and clearance coordination.
- **Appliance power points and dedicated loads.**
- **Plumbing/service coordination** where included in the project scope.
- **Combined coordination sheet:** furniture, ceiling, lighting, electrical points and AC/service interfaces.

The package must clearly distinguish:
- Design shown.
- Included in accepted quotation.
- Optional/separately priced.
- Excluded.
- Additional work requested.
- Approved additional work.

A drawing element must never automatically mark a service as commercially included. Electrical, HVAC, structural and other technical execution information must be checked by the appropriately qualified site professional before execution where required. These drawings support coordination and documentation; they do not replace professional site verification.

### 7.3 Drawing controls, revisions and output

- Generate by module/item, room, discipline or project.
- Select views/sheets and show/hide dimensions, material tags and notes.
- A4/A3/A2 page setup, suitable scale, readable lineweights and dimension styles.
- Module Studio branding and project title block.
- Unique drawing number, revision, date, scale, units, prepared-by and status.
- Preview before issue.
- PDF and print-ready output; retain structured source data for regeneration.
- Statuses: Draft / For Customer Review / Approved / Superseded.
- Identify affected drawings after a design change and allow selective regeneration.
- Never silently alter an issued/approved drawing; retain prior revisions.

---

## 8. Material and accessory detail sheet generator

Upgrade the existing **PROJECT MATERIAL & HARDWARE SUMMARY** generator. Do not create a competing summary engine.

Generate from saved project data:
- Project material summary.
- Room-wise material sheet.
- Module-wise specification/detail sheet.
- Hardware schedule.
- Accessories schedule.
- Countertop/surface schedule.
- Glass and aluminium schedule.
- Lighting schedule.
- Design specification with dimensions, colours, finishes and reference images.

Each sheet should support available item code/name, brand, model, image, colour, finish, grade, thickness, dimensions, technical specification, estimated quantity/UOM, room/module reference, supplier reference and customer-facing description.

Support PDF, Excel and print output where practical. Include client/project/date/revision. Approved sheets must be reproducible; a later material change must create a new revision and flag the old sheet as superseded/outdated.

---

## 9. Existing quotation and proposal integration

**Reuse and extend the existing ModuCraft quotation engine. Do not create a second quotation/proposal system.**

The existing application already contains quotation management and preview/print, module rates, room-base pricing, package pricing, internal material costing, GST-related handling, discounts, invoices and payment milestones. Preserve these existing workflows and verify them before changing shared code.

Required flow:
1. Interior Studio creates rooms, modules, finishes, accessories and surfaces.
2. Studio provides design dimensions, areas, quantities and selected specifications.
3. Existing quotation engine receives validated design inputs through a defined adapter.
4. Existing pricing modes/rates, discounts, taxes and payment logic remain authoritative.
5. Customer proposal may include room-wise/module-wise prices, 2D/3D visuals, material specifications, accessories, surfaces and optional upgrades where applicable.
6. Internal purchase costs and profit margins must not be exposed in customer-facing documents.
7. Approved quotation freezes its commercial values and linked design revision.
8. Subsequent design changes create a new revision and require explicit reapproval/revised quotation where applicable.

Requirements:
- Reuse existing customer, project and quotation IDs.
- Do not create duplicate quotations for the same design transaction.
- Identify project and design revision in quotation records/documents.
- Preserve internal costing separation.
- Preserve approved design and pricing snapshots.
- Reuse existing quotation summary/detail and material summary workflows.

---

## 10. ERP integration architecture

ERP integration is a core architecture requirement, not a final optional add-on.

- Existing ERP remains authoritative for customers, projects/quotation identity, vendors, material/accessory masters, rates, invoices, payments and commercial records.
- Design Studio owns design geometry, placements, customization, design revisions, drawing data and calculation inputs.
- Use a defined versioned integration interface/API; avoid direct browser-side writes into unrelated ERP storage.
- Reuse stable IDs; do not duplicate customer, vendor, material or quotation masters.
- Save design revisions against existing projects.
- Synchronize quotation data through explicit validated transactions.
- Support idempotent retries without duplicate records.
- Detect stale versions and conflicts before write.
- Preserve existing roles/permissions and tenant/company data isolation.
- Record who changed a design or approved a quotation.
- Provide error handling, retry and recovery for failed synchronization.
- Keep the current online ERP running during development and any future backend migration.

Do not make production database/backend changes as part of isolated Studio development without explicit approval. The designated database account and future migration planning remain separate from the immediate Design Studio implementation.

---

## 11. Revision, approval and audit workflow

Support:
- Room-level approval.
- Material-level approval.
- Individual module comments.
- Design alternatives.
- Before/after revision comparison.
- Customer approval/rejection evidence.
- Designer/reviewer permissions.
- Approved design snapshot.
- Approved quotation snapshot.
- Audit history.

Minimum revision states:
- Working Draft.
- Issued for Customer Review.
- Customer Changes Requested.
- Approved.
- Approved for Project Execution.
- Superseded.

For every revision retain changed item/room/material/service point, before/after values, reason, designer, timestamp, affected drawings/schedules, quantity/quotation impact where calculable and approval evidence.

Approved revisions are immutable. Editing an approved design creates a new revision. The software must not claim customer approval unless evidence is actually recorded.

---

## 12. Design validation and compatibility rules

Identify and report:
- Furniture/module overlapping doors, windows or other objects.
- Cabinet intersecting pillars, beams or obstructions.
- Insufficient opening or appliance service clearance.
- Incompatible accessories for selected module dimensions/configuration.
- Countertop cutout conflicts or invalid placement.
- Incompatible shutter/hinge/opening configurations.
- Invalid or inconsistent room/module dimensions.
- Missing material or finish specifications.
- Conflicts between furniture, false ceiling, lights, fans, AC and service points.

Separate warnings from blocking errors. Authorized users may override permitted warnings only with a recorded reason. Do not silently correct design geometry.

---

## 13. Project lifecycle integration

Installation and handover remain wider ERP/project operations. Provide references and outputs to support:
- Installation checklist.
- Room-wise completion and partial handover.
- Snag records with room/location, description, photos, date and status.
- Rectification tracking.
- Final handover and approved drawing archive.
- Warranty/service records linked to project and handover date.

Do not overload the 3D editor with financial administration, invoicing or warranty case management.

---

## 14. Acceptance criteria and QA gates

Do not mark a feature complete merely because a button or panel exists. Test complete workflows.

### Design and geometry
- Room categories and multiple rooms work together.
- Rectangular, L-shaped, U-shaped, irregular and angled walls retain correct dimensions through editing and save/reopen.
- Wall/opening/column/beam/niche positions agree in plan, elevations, sections and 3D.
- Furniture placement, rotate, resize, align, snap and clearance checks behave predictably.
- Dimensions are consistent in mm; no cm/mm or width/height/depth swaps.
- Catalogue identity and dimensions survive add/edit/save/reopen.
- Changing room category does not silently delete design information.

### Customization
- Shutter finish is independent from carcass finish.
- Glass/aluminium, profiles, handles and opening styles appear correctly in all views and detail sheets.
- Countertops, edges, sink/hob cutouts and backsplash are represented and quantities are traceable.
- Material/accessory selections retain catalogue references and approval snapshots.

### Persistence and history
- Save/reopen preserves project, rooms, geometry, modules, materials, accessories, service points and revisions.
- Undo/redo restores actual prior states.
- Autosave/crash recovery is tested.
- Save failures are visible and recoverable.

### Drawing and documents
- Furniture technical/detail sheets match the selected saved design revision.
- Material marks resolve to selected catalogue specifications.
- No cutting list/CNC/nesting/factory production output is generated.
- Onsite sheets use the same room coordinates and align with furniture/ceiling/electrical/AC design.
- Drawing title blocks, numbers, revision, date, scale, units, legend and status are correct.
- Approved/issued revisions remain unchanged after subsequent edits.
- PDF/Excel/print layouts are checked at supported sizes.

### Quotation and ERP
- Existing quotation modes, rates, GST, discounts, invoices and payment milestones pass regression tests.
- Design quantities/specifications flow into the existing quotation without duplicate records.
- Internal costs are not exposed in customer-facing output.
- Existing customer/project/quotation/master IDs are preserved.
- Sync is tested on safe staging/test data first; stale versions/conflicts are detected.
- Existing live ERP operation is not disrupted.

### Scope controls
- Included/optional/excluded/additional-work flags remain distinct.
- Appearance in a drawing does not imply commercial inclusion.
- Approval evidence and revision audit are retained.

---

## 15. Development sequence

The integration contract and data ownership boundaries must be designed from the beginning, while implementation remains isolated and production-safe.

1. Reinspect the current branch and stabilize project/room data model, units, IDs and persistence.
2. Complete room/category engine and core 2D geometry, elevations, properties, undo/redo and save/reopen.
3. Deliver genuine interactive 3D visualization with synchronized views.
4. Complete catalogue-backed module, shutter, facade, material, accessory and countertop customization.
5. Add site survey, appliances and service coordination.
6. Build the Furniture Technical/Detail Drawing package (not factory manufacturing drawings).
7. Build the separate Onsite Execution/Coordination Drawing package.
8. Upgrade the existing Material & Hardware Summary and generate room/module detail schedules.
9. Add design validation, revisions, approvals and commercial scope flags.
10. Connect design quantities and specifications to the existing quotation engine.
11. Validate ERP master-data integration and safe synchronization.
12. Add handover/snags linkage and end-to-end regression.

---

## 16. Current development baseline and reporting

The last available repository review identified basic room geometry, plan rendering, basic module/site-element placement, wall elevations and a schematic SVG isometric preview. It also identified incomplete or unverified areas including full interactive 3D, live catalogue coverage, Auto Loft, real Undo/Redo, material catalogue integration, reliable save/reload, technical/detail drawing generation, onsite execution drawings, approval/revision workflow and end-to-end quotation/ERP integration.

These are prior review findings, not fresh browser QA results. Reinspect and test before changing status. Clearly report:
- Implemented and tested.
- Code-present but not fully tested.
- Incomplete.
- Not started.
- Blocked.

Do not claim bug-free or production-ready without recorded test evidence.

---

## 17. Branch, production and release controls

- Work only on `feature/interior-studio` until explicit merge approval.
- Do not merge to or modify `main` without explicit owner approval.
- Do not deploy or change the running online ERP without explicit approval.
- Preserve existing quotation, invoice, payment and project workflows.
- Report actual commits, files changed, tests run and results.
- Launch target previously specified by the owner: **19 November 2026, 10:00 AM IST**. Prioritize a tested and safe deliverable over unsupported completion claims.
