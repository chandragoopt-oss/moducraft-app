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


---

## 18. Architecture decision recorded from earlier project discussions

The owner previously rejected repairing the unsatisfactory legacy 3D tool as the primary solution and approved a **new, separate Interior Studio application**.

- Build the new application in a dedicated `interior-studio/` directory.
- Preserve the existing ERP and legacy `studio/` directory. Do not destabilize, delete or silently replace either.
- Integrate the new Studio into the ERP only through a deliberate, tested integration bridge after the new application works independently.
- The existing checkpoint/tag `pre-new-interior-studio` is a recovery boundary; preserve it.
- The previously agreed implementation direction is React + TypeScript + Vite, Three.js / React Three Fiber for 3D, SVG-based 2D drawing/CAD interaction, Zustand for application state and Zod for schema validation. Re-evaluate only if repository constraints make a documented alternative necessary.
- Keep design-domain logic independent from the ERP UI so the Studio can be run as an online web application and can later be packaged as a desktop application.
- Design offline/local working capability deliberately, with clear save status and safe synchronization when online. Do not silently overwrite a newer server version with stale offline data.
- The Studio must not directly mutate production ERP storage. Use a documented, versioned adapter/contract and safe test data first.
- Existing ERP remains authoritative for customer, project, quotation, module catalogue, accessory/material masters, rates, invoices and payments. Studio owns its room geometry, furniture placements, design options, drawing data and design revisions.
- The designated Google account `databasemoducraft@gmail.com` is reserved for the user's planned database/Google services work. This does not authorize an immediate production migration or changes to the running online ERP.

This architecture decision supersedes any interpretation of the earlier development sequence that implies rebuilding the legacy `studio/` in place.

## 19. The single-designer, fast-turnaround operating model

Design the product around one interior designer completing the full customer journey with minimal hand-offs. The designer may be working under severe time pressure, switching between customer discussion, measurement, design, pricing, presentation and documentation. The application must reduce repeated entry, context switching and memory-based checking.

The target is a guided, low-friction workflow that can produce a coordinated proposal and approval package in one customer meeting when the inputs are available. The software cannot guarantee customer approval or compensate for missing/incorrect site measurements; it must expose missing information and uncertainty rather than inventing it.

### 19.1 One project command centre

Create one project dashboard showing:
- Customer/contact details and existing ERP customer/project/quotation references.
- Project address, property type, project status and target dates.
- Rooms and their completion status.
- Site survey status and missing measurements.
- Design status and selected design revision.
- Customer brief, budget, preferred style and constraints.
- Material/finish selections and approval status.
- Appliance/service coordination status.
- Estimate/quotation status.
- Drawings and presentation pack status.
- Outstanding validation errors, warnings and decisions.
- Last saved/synced status, last editor and revision.

Use a single visible progress checklist, with one-click navigation to incomplete tasks. The dashboard must show what prevents customer sign-off, not just a percentage score.

### 19.2 Guided project intake and design brief

A fast intake flow should capture once and reuse throughout the project:
- Customer goals, family/users and room usage.
- Room list, priorities and functional requirements.
- Style direction, reference images and inspiration.
- Preferred colours/materials/finishes and items to avoid.
- Budget range and priority trade-offs.
- Existing furniture/appliances to retain.
- Appliance make/model/dimensions or clearly marked provisional dimensions.
- Storage needs and special requirements.
- Accessibility, child-safety, maintenance and durability requirements where relevant.
- Vastu preferences/directions where requested by the customer.
- Site constraints, building rules and landlord/society restrictions where applicable.
- Target timeline and decision-makers.
- Customer-provided references, sketches, photographs and documents.

Provide a quick brief mode for live meetings and a more detailed mode for later completion. Mark every field as confirmed, provisional, unknown or not applicable. Never present a guessed value as customer-confirmed.

### 19.3 Site survey capture designed for speed and accuracy

- Mobile/tablet-friendly survey interface with room-by-room checklists.
- Wall-by-wall dimension entry, height, thickness, diagonals and opening positions.
- Capture door/window width, height, sill/lintel height and swing/slide direction.
- Record columns, beams, niches, shafts, skirting, ledges, floor level differences and ceiling drops.
- Record electrical, plumbing, gas, drainage, AC and exhaust points.
- Attach photographs to the exact room/wall/point and add arrows/notes.
- Capture measurement source, date, person and confidence/status.
- Highlight missing dimensions and impossible/inconsistent measurements.
- Allow a rough preliminary survey and a later site-verified revision.
- Support unit conversion while storing canonical geometry in millimetres.
- Where an image/PDF/DWG/DXF underlay is imported, allow calibration against known dimensions, scale/rotation/origin setting and tracing. Preserve the original as a reference layer. Imported drawings are not automatically assumed accurate or current.
- Provide a survey completion report before design is marked ready for customer approval.

If camera-based measurement, LiDAR or automatic photo dimension extraction is ever offered, treat it as an estimate requiring manual confirmation, not authoritative site measurement.

### 19.4 CAD and reference-file intake

Support a controlled import workflow for formats the implementation can reliably parse:
- DWG/DXF where a supported parser/conversion path is available.
- PDF plan underlays.
- Common raster images such as PNG/JPG.
- Existing project drawings and reference images.

Import flow must allow:
- Select pages/layers and visible reference elements.
- Set units, scale, origin and rotation.
- Verify scale using at least one known dimension.
- Lock/unlock reference underlay.
- Trace/convert selected walls/openings where reliable.
- Preserve the uploaded original and record its source/date.
- Compare imported plan against site-verified measurements.
- Flag uncertain geometry instead of silently converting it into exact dimensions.

Never redraw or redesign an imported client plan automatically without explicit designer action. When the customer has identified an existing CAD plan as the source of truth, preserve walls, thickness, boundaries, doors/opening directions, windows, columns, balconies, projections, furniture and circulation unless the designer explicitly edits them.

### 19.5 Rapid room setup and reusable design intelligence

Provide:
- One-click room templates for common room types and standard layouts.
- Saved company templates and designer's own reusable templates.
- Reusable wall runs, cabinet combinations, wardrobe interiors, TV units, vanity units, study units, false-ceiling patterns and lighting layouts.
- Copy room / duplicate wall / duplicate module / mirror layout / repeat along wall.
- Room presets with editable dimensions, never fixed unchangeable dimensions.
- Recent and favourite modules, materials, accessories and finishes.
- Search by module name, code, category, dimensions and keywords.
- Bulk selection and bulk property editing.
- Multi-select material/finish assignment with preview and confirmation.
- Keyboard shortcuts, right-click/context menus, command search and undo/redo.
- Quick actions for common operations.
- Save any approved room or furniture arrangement as a reusable template.
- Clear distinction between catalogue standard dimensions and designer-customized dimensions.

The design must never force the designer to re-enter a room's dimensions or the same customer/material data in multiple screens.

### 19.6 Fast furniture planning and intelligent assistance

Provide optional, designer-controlled assistance for:
- Suggesting module combinations based on available wall length and functional brief.
- Filling remaining wall gaps with valid fillers/end panels or suitable modules.
- Aligning base, wall and tall units.
- Generating lofts from available wall/ceiling dimensions.
- Suggesting wardrobe internal layouts from storage requirements.
- Suggesting drawer, shelf, hanging and accessory arrangements.
- Checking standard clearances and appliance dimensions.
- Detecting unused/dead spaces and potential clashes.
- Suggesting alternative layouts when a selected arrangement fails validation.
- Comparing standard, premium and luxury design alternatives.
- Generating a design option from a selected template/catalogue only when the designer requests it.

All generated/suggested changes must be previewed, explain their assumptions and require designer acceptance. No AI or automation may silently move/delete modules, change a confirmed dimension, replace a material, alter a price or modify an approved design.

### 19.7 Complete catalogue coverage and module-specific detail

The Studio must fetch the user's existing live module, accessory, material and other lists from the ERP rather than relying on hardcoded sample items. Catalogue mapping and missing-item diagnostics are required.

Include the previously discussed product-specific examples where they exist in the ERP catalogue or are explicitly configured:
- Kitchen base, sink, pantry, wall, loft, corner and breakfast-counter modules.
- Aluminium glass shutters, including clear, frosted and fluted glass options.
- Kitchen pantry soft-close complete system mechanism and flat-base basket.
- Rolling shutter and wall tambour units.
- L-shaped chimney duct/front panel.
- Bedroom beds, headboards, bedside units, study units, wardrobes, dressers and TV units.
- Living room TV units and crockery/display units.
- Room-specific accessories and add-on modules.

The module picker must not silently fall back to a hardcoded wardrobe or dummy module when the catalogue fails to load. Show loading/error/empty states and let the designer retry or work with a clearly marked cached catalogue.

For accessory schedules, clearly distinguish pull-out mechanisms from rack-only/static accessories. Show accessory quantity, compatibility, module association and whether it is selected, optional or not selected.

### 19.8 Materials and visual selection in the customer meeting

- Material board / finish board generated from the actual selected catalogue records.
- Side-by-side finish alternatives with labels, images, brand/model and finish code where known.
- Compare carcass, shutter, countertop, glass, profile, handle and hardware independently.
- Save a room palette and apply it consistently to selected rooms/modules.
- Show a material change live in 3D without losing geometry or other selections.
- Track proposed, shortlisted, customer-selected, approved and unavailable/substitution states.
- Capture customer comments and decision against each sample.
- Do not show placeholder swatches or fake brand/model information as actual products.
- Support alternate selections with estimated commercial difference only when ERP rate data is available and authorized.

### 19.9 Presentation mode built for one-meeting sign-off

Provide a customer-facing Presentation Mode that hides editing controls, internal notes, cost/margin data and unfinished engineering information.

A guided presentation should assemble:
1. Customer/project cover page and design brief.
2. Existing plan / proposed layout comparison where available.
3. Room-by-room 2D plan and dimensions.
4. Room-by-room wall elevations.
5. Photorealistic or best-supported 3D views from useful camera angles.
6. Material and finish boards with clear product labels.
7. Module and accessory highlights.
8. Appliance and service coordination notes.
9. Key dimensions, assumptions and items requiring site verification.
10. Room-wise commercial summary using the existing quotation engine.
11. Included / optional / excluded / additional work summary.
12. Timeline, validity and customer terms from the existing quotation workflow.
13. Customer decisions, comments and sign-off record.

Presentation tools:
- Full-screen room navigation.
- One-click camera presets (wide view, eye-level, wall view, detail view).
- Smooth room-to-room navigation and optional walkthrough.
- Hide/show dimensions, labels, annotations and selected furniture layers.
- Compare two design options side by side.
- Highlight changed items between revisions.
- Capture customer comments against a room, wall, module, material or drawing.
- Generate a coherent branded PDF presentation and quotation pack without manually arranging every page.
- Save the exact presentation snapshot shown to the customer.

Do not promise photorealistic quality for a renderer that has not been implemented or tested. Use accurate geometry and materials first; expose render quality/status honestly.

### 19.10 Customer sign-off and decision capture

The application should make it easy to record sign-off in the meeting:
- Approve/reject/request change at project, room, module, drawing and material level as applicable.
- Record approver identity, role, date/time and decision.
- Capture comments and attachments.
- Record the approved design revision and exact presentation/quotation snapshot.
- Record customer confirmation of dimensions, layout, appliance information, finishes and scope, with items still subject to site verification clearly identified.
- Record accepted, optional and excluded items separately.
- Support a signature/acceptance workflow through an available authorized method; otherwise record the actual written approval evidence and its source. Do not fabricate an electronic signature.
- Generate a customer approval summary and send/export it through supported channels.
- A requested change after approval creates a new revision and identifies price/timeline/drawing impact.
- Never silently change an approved drawing, material or quotation.

### 19.11 Automated completeness and error-prevention gate

Before enabling “Issue for Customer Sign-off”, run a comprehensive checklist across the project.

Check at minimum:
- Customer/project/quotation linkage exists.
- All intended rooms are included and categorized.
- Each room has required dimensions and a survey confidence/status.
- Walls, doors, windows, openings and obstructions are valid.
- Module positions, sizes, orientation and wall associations are valid.
- No blocking overlaps or unresolved critical clearances.
- Appliance sizes and required clearances are confirmed or explicitly provisional.
- Shutter, carcass, material, finish, hardware and accessories are specified or intentionally marked pending/not applicable.
- Countertop and sink/hob positions are consistent.
- Lighting, ceiling, fans, AC, sockets and service points are coordinated where in scope.
- Required 2D plans, elevations and 3D views exist.
- Required technical/detail and onsite sheets are generated where applicable.
- Material and accessory schedules reconcile with selected design items.
- Design quantities and commercial lines have a traceable source.
- Included/optional/excluded/additional scope is explicit.
- Existing quotation totals reconcile with the design-linked commercial lines.
- No internal cost/margin data appears in customer documents.
- All warnings, overrides and assumptions are visible.
- Customer-facing PDF pages render correctly and contain no blank/overflow/cut-off content.
- The correct revision is attached to the approval pack.
- Save/sync status is successful or any offline limitation is prominently disclosed.

Use severity levels:
- **Blocker:** cannot issue approval pack until resolved.
- **Warning:** may proceed only after designer acknowledgement and, where appropriate, a reason.
- **Information:** assumption, pending confirmation or site verification item to disclose.

Provide one consolidated error list with click-to-fix navigation. Do not make the designer hunt through tabs to find errors. Allow a deliberate, permission-controlled override with reason for noncritical warnings; never allow an override to disguise missing customer approval or invalid commercial data.

### 19.12 Automated document and schedule generation

With one command, generate a selected pack from the same saved revision:
- Customer presentation PDF.
- Existing ERP quotation/proposal.
- Room-wise 2D plan and elevations.
- Furniture technical/detail drawings.
- Separate onsite execution/coordination sheets.
- Material and hardware summary.
- Room-wise and module-wise specifications.
- Accessories schedule, including pull-out versus rack-only distinction.
- Estimated material quantity sheet, including board/ply thickness-wise quantities where calculation rules support them.
- Site requirement/order sheet.
- Appliance and service point schedule.
- Drawing register and approval register.

These are design, site and commercial outputs. They must not turn into factory cutting lists, CNC files, nesting or manufacturing BOMs. Clearly label estimated quantities versus verified/ordered quantities.

The output pack must be reproducible from the stored project revision. A change must identify which pages/schedules became outdated and regenerate only the affected documents.

### 19.13 Existing commercial and scope workflow made faster

Integrate with the existing quotation modes and preserve them:
- Module rates (automatic).
- Room base pricing (per square foot).
- Package pricing (flat per room).
- Internal material costing.

Preserve existing GST, discounts, quotation preview/print, invoices, payment milestones and payment tracking. Design Studio may provide validated quantities and specifications; the existing ERP quotation engine remains authoritative for rates and totals.

The designer must be able to compare design options with their commercial impact without exposing internal purchase cost or margin. Clearly surface:
- Included in quotation.
- Optional / separately priced.
- Excluded.
- Additional work requested.
- Awaiting assessment/approval.
- Approved additional work.

Carry forward the existing customer note/terms for additional services (including additional civil work, floor changes, AC fittings, designer lights, curtains, automation, canopies, electronics, mosquito nets and other value-added services) from the ERP's maintained quotation terms. Do not hardcode a second, potentially outdated terms document in Studio.

### 19.14 Time-saving quality-of-life requirements

- Autosave with visible “Saving / Saved / Offline / Sync error” status and last-saved time.
- Automatic recovery after tab/browser crash or accidental close.
- Confirm before destructive actions; provide undo for recoverable actions.
- Search-anything command palette for rooms, modules, materials, tools and actions.
- Recent projects, recent designs and favourites.
- Duplicate project as a template without copying customer-sensitive or commercial records.
- Copy/paste modules and properties between rooms with compatibility checks.
- Bulk rename, bulk material assignment and bulk dimension editing.
- Multi-select move/align/distribute.
- Snap, guides, alignment lines, grid and dimension constraints.
- Configurable default units, heights, depths, offsets and standard dimensions.
- Clear visual indication of selected object, locked object, hidden layer and read-only/approved object.
- Layer visibility and lock controls for architectural shell, furniture, appliances, ceiling, lighting, electrical, plumbing, HVAC, annotations and dimensions.
- Per-room notes and global project notes.
- Automatic file naming, drawing numbering and revision numbering.
- Batch export and print queue with page preview.
- Keyboard-friendly operation and tablet/touch-friendly controls.
- Performance targets and progressive rendering so large projects remain usable.
- Helpful empty states, tooltips and contextual help; avoid modal dialogs for every routine action.
- No dead buttons, fake progress indicators or placeholder controls presented as completed features.

---

## 20. Additional design disciplines and details that must not be overlooked

The following are required where relevant to the project scope and data is available:

### Architectural and interior finishes
- Flooring layout, material, direction/pattern, skirting, transition strips and room-wise area.
- Wall cladding, panelling, wallpaper, decorative profiles and feature walls.
- Paint/texture finish and wall-wise area/colour schedule.
- Doors, frames, architraves and hardware where part of the design.
- Windows, curtains, blinds and pelmets where in scope.
- Mirrors, glass partitions and decorative glass.
- Staircase/railing or other architectural elements only where applicable.

### Ceiling and lighting
- Reflected ceiling plan with ceiling levels and dimensions.
- Cove/profile/linear lighting, spotlights, downlights, pendants, chandeliers and task lighting.
- Fan positions and clearance from lights, wardrobes and tall furniture.
- Access panels, AC grilles, exhaust and maintenance access.
- Lighting groups, switching and dimming intent.
- Fixture schedules with selected/provisional product status.

### Services and appliance coordination
- Kitchen appliance dimensions, ventilation, exhaust/chimney duct route, gas point, water inlet/drain and dedicated electrical loads.
- Refrigerator, dishwasher, oven, microwave, hob, chimney, washing machine, geyser and other selected appliances as relevant.
- Bathroom plumbing points, vanity, mirror lighting, exhaust and service access.
- Split AC indoor/outdoor location, pipe/drain route and maintenance access.
- Electrical panel/DB and switchboard references where supplied.
- Avoid clashes with beams, false ceilings, furniture and doors.

### Furniture design usability
- Wardrobe hanging zones, drawers, shelves, loft and access.
- Bed clearances, bedside access and drawer movement.
- Murphy/foldable furniture where selected.
- Study desk ergonomics and task lighting.
- TV viewing position, screen size and cable/power/data points.
- Kitchen work triangle and practical worktop clearances.
- Pantry, pull-outs, corner mechanisms, waste bins and appliance integration.
- Access for cleaning, maintenance, plumbing and electrical repairs.
- Edge/finish continuity across adjacent modules and rooms.

These details must be configurable, not forced into every project. Do not present generic ergonomic rules as a substitute for site-specific professional judgment.

## 21. Design alternatives and customer decision efficiency

Support at least two or three clearly differentiated alternatives where the designer chooses to present options:
- Layout alternatives (A/B/C).
- Finish/material alternatives.
- Standard / Premium / Luxury specification tiers.
- Optional add-ons and scope alternatives.

Each alternative must:
- Share the same verified room shell and survey baseline.
- Be independently saved without overwriting the primary design.
- Show visual differences and a concise comparison.
- Show price delta only from authorized existing ERP rates.
- Identify changes to quantities, materials, drawings and timeline assumptions.
- Allow the customer to select one option and record the decision.
- Preserve rejected options for reference without treating them as approved.

## 22. Error prevention, reliability and operational safeguards

- Validate all project data at entry and before save/export/sync.
- Use typed, versioned schemas and migrations for project/design data.
- Prevent invalid dimensions, NaN/zero/negative geometry and unit-conversion errors.
- Ensure plan/elevation/3D/document outputs derive from the same canonical geometry.
- Use stable IDs for rooms, walls, modules, openings, materials, accessories and drawings.
- Maintain an operation history for undo/redo and an audit history for business approvals.
- Autosave locally and synchronize safely when online.
- Provide recoverable backups and visible conflict resolution for concurrent edits or offline synchronization.
- Warn when a catalogue item has been deleted, changed or is unavailable; preserve the approved historical snapshot.
- Never silently substitute a module, material, accessory, appliance or rate.
- Make every export reproducible from a named design revision.
- Provide automated unit tests for geometry/calculations, integration tests for save/reopen and ERP adapter, and end-to-end tests for the full customer sign-off journey.
- Maintain a known-issues register and release checklist.
- Keep test/staging and production credentials/data separate.

## 23. Prioritization for the launch target

The owner previously set the launch target as **19 November 2026, 10:00 AM IST**. This is a demanding target; scope must be prioritized transparently rather than claiming every advanced capability is complete.

### Release-critical foundation
1. New separate Interior Studio shell and reliable project persistence.
2. Customer/project linkage and existing catalogue access through a safe adapter.
3. Room setup, verified dimensions, architectural openings and obstacles.
4. Fast 2D design and synchronized usable 3D.
5. Catalogue-backed furniture placement and core customization.
6. Save/reopen, undo/redo, autosave and error reporting.
7. Customer presentation mode with 2D/3D views and material selections.
8. Basic approval/revision capture.
9. Existing quotation engine handoff without duplicate pricing.
10. Minimum automated completeness checks and regression tests.

### Next essential workflow layer
- Furniture technical/detail drawings.
- Separate onsite execution sheets.
- Material/accessory detail sheets and site requirement schedule.
- Appliance/service coordination.
- Alternatives and tiered material options.
- Advanced shutter/facade/countertop customization.
- Full approval and document revision controls.

### Advanced enhancements after the safe core
- More complex irregular geometry and specialized architectural objects.
- Deeper rendering/material realism and walkthrough quality.
- Assisted layout suggestions and more extensive automation.
- Extended offline/desktop packaging.
- Advanced reporting and project lifecycle integrations.

Do not remove previously agreed scope by placing it in a later phase; phase implementation and clearly label what is delivered in each release.

## 24. End-to-end “designer alone, customer sign-off” acceptance scenario

A release candidate must demonstrate the following realistic scenario without developer intervention:

1. Designer opens the Studio from an existing ERP customer/project or creates the project through the authorized flow.
2. Enters the brief, budget, room list, preferred style and customer constraints once.
3. Imports or draws the plan, sets scale/units and records site dimensions, openings and services.
4. Completes a survey checklist and identifies unverified measurements.
5. Creates multiple room categories using editable templates.
6. Fetches the live ERP module/material/accessory catalogue and places the required modules.
7. Customizes carcass, individual shutters, handles, glass/aluminium, accessories, appliances and countertops.
8. Coordinates ceiling, lights, fans, electrical points, AC and other relevant services.
9. Checks plan, elevations, sections and 3D; fixes all blockers and acknowledges permitted warnings.
10. Creates and compares alternative design/material options if required.
11. Generates room-wise material boards, technical/detail drawings, onsite coordination sheets and estimated schedules from the same revision.
12. Sends validated quantities/specifications to the existing quotation engine and previews the customer quotation.
13. Enters Presentation Mode and navigates the complete project with the customer.
14. Captures comments, option selection, approvals and any pending site-verification items.
15. Runs the final sign-off completeness gate.
16. Generates the branded customer presentation/quotation/approval pack.
17. Saves the exact approved design and commercial snapshots against the existing ERP project.
18. Reopens the project and verifies that the saved design, presentation, quotation linkage and approval record are intact.

The acceptance test must include at least one failure case: missing measurement, unavailable catalogue item, save failure, stale data or a design clash. The Studio must clearly detect and recover/report it without corrupting the project.

## 25. Final product principle

The Studio is not merely a 3D modeller. It is a **single-designer interior project completion system**:

**Capture → Plan → Design → Customize → Visualize → Validate → Estimate → Present → Approve → Document → Sync.**

The designer should enter project information once, work from one consistent model, see all outstanding decisions in one place and generate every required customer/site/commercial output from the same approved revision. Speed must come from reusable templates, live catalogues, intelligent assistance and automated checking—not from hiding uncertainty, skipping verification or silently guessing.
