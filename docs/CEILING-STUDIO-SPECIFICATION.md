# ModuCraft Ceiling Studio — product and engineering specification

**Status:** Planned foundation; Pinterest reference review pending user-provided board screenshots.
**Branch:** `feature/interior-studio`
**Scope:** Parametric false-ceiling design, room adaptation, 3D visualisation and onsite execution drawing generation.
**Boundary:** This is an Interior Studio capability. It is not a factory manufacturing, CNC, nesting or panel-cutting feature.

## 1. Product objective

Give a designer a curated, expandable library of false-ceiling concepts that can be selected, fitted to a surveyed room, reviewed in 3D, adjusted and converted into coordinated onsite execution drawings with minimal repetitive drafting.

A catalogue entry must be more than a photograph. It is a versioned parametric design definition with geometry, constraints, material/lighting options, compatibility rules and drawing-generation instructions. Reference images explain the look; the parametric definition drives the actual model and drawings.

## 2. User workflow

1. Open a room in the project and confirm its surveyed geometry.
2. Open **Ceiling Studio** and filter the library by room type, style, ceiling height, complexity, lighting intent and site constraints.
3. Compare reference photographs, 3D preview, plan/section thumbnails and execution notes.
4. Select a design and choose **Fit to room**.
5. The fitting engine reads the canonical room model and proposes dimensions, levels, offsets, feature positions and lighting zones.
6. Review fit report: accepted constraints, warnings, blocking conflicts and any assumptions.
7. Adjust permitted parameters (drop, border width, island size, offsets, curves, material, light spacing, cove width, access-panel location).
8. Preview the same model in plan, sections and 3D.
9. Run validation and resolve blocking issues. Warnings may be overridden only with a recorded reason and appropriate permission.
10. Generate the onsite execution drawing package and material/accessory schedule.
11. Save a revision and send selected views to the existing customer presentation / approval workflow.

## 3. Canonical model and integration

- Use the same project and room identity as the Interior Studio; do not create a second project or room database.
- Store all geometry in millimetres, with stable IDs and explicit units at API boundaries.
- The room model is authoritative for wall segments, non-rectangular corners, openings, beams, columns, slab/ceiling levels, doors, windows, curtain tracks, appliances and existing services.
- Ceiling geometry, lighting, electrical points and service coordination are owned by the Studio design model and reference room/site-element IDs.
- Plan, reflected ceiling plan, sections, elevations where relevant, 3D and schedules must be derived from one versioned model.
- ERP remains the system of record for customer, project, quotation, rates, taxes, payments and commercial approval. Studio supplies validated specifications and quantities to the existing ERP quote engine.
- Persist design revision, source template version, parameter values, fit report, validation report and generated-document revision together.

## 4. Library taxonomy

Initial category coverage (provisional until the Pinterest board images are reviewed):

- **Perimeter and tray:** simple perimeter, recessed tray, floating tray, single/double stepped border.
- **Cove and indirect light:** single cove, double cove, perimeter wash, concealed linear light.
- **Linear and slatted:** parallel bands, timber-look slats, gypsum linear strips, mixed-material bands.
- **Feature raft/island:** central raft, floating island, bed-aligned feature, dining-table-aligned feature.
- **Geometric/contemporary:** asymmetrical bands, offset rectangles, layered geometric forms.
- **Classic/luxury:** coffered, multi-level, curved feature, decorative centre.
- **Room-specific:** living, bedroom, dining, foyer, study, kitchen/utility and commercial.
- **Functional/service-friendly:** access-friendly grid, service bulkhead, AC/curtain coordination, acoustic or modular ceiling.

Each design can belong to multiple categories and room types. Do not hard-code a single room-type mapping.

## 5. Parametric design definition

A catalogue design should include:

- Identity: stable ID, name, description, category tags, style tags, author, status, version, created/updated timestamps.
- Media: reference image URLs/assets, attribution/source URL, preview render, plan thumbnail, section/detail thumbnails; each asset has rights/source metadata.
- Applicability: room types, minimum/maximum room dimensions, minimum recommended slab height, typical and minimum drop, complexity, skill/execution notes.
- Geometry: parametric primitives and profiles (perimeter bands, trays, rafts, islands, coffers, curves, steps, bulkheads), anchoring/alignment rules, offsets, symmetry and repeat rules.
- Constraints: allowed parameter ranges, minimum edge distances, minimum clearances, maximum unsupported spans (where specified by the selected system), ceiling-level constraints and incompatible combinations.
- Construction: substrate/support assumptions, board/material type and thickness, framing/system notes, joints, access and maintenance requirements.
- Lighting: fixture types, spacing rules, offsets, cove/LED channel geometry, driver/access locations, switching/circuit grouping and optional dimming notes.
- Coordination: fan, chandelier, AC grille, sprinkler/smoke detector, curtain track, access hatch and existing electrical-point rules.
- Outputs: drawing view definitions, dimension anchors, section cuts, annotation templates, schedule mappings and validation rules.
- Defaults: parameter values and safe starting configuration; never treat defaults as verified site dimensions.

Use a versioned JSON-compatible schema and validate every template at import/publish time. Separate visual-only fields from execution-critical fields.

## 6. Automatic room fit

### Inputs
- Surveyed room polygon / wall segments, not only length and width.
- Slab/structural ceiling level and any measured level variation.
- Beams, drops, columns, projections, niches and other obstructions.
- Doors, windows, curtain tracks and opening swing/clearance zones.
- Fan, AC, chandelier, lighting, sprinkler/smoke detector and service locations where known.
- Required access panels, service routes and maintenance zones.
- Designer-selected ceiling level, drop limits, materials and lighting intent.

### Fitting behaviour
- Anchor the design to a selected wall, room centre, bed, dining table, seating zone or other explicit reference.
- Scale/repeat permitted geometry while preserving design proportions and minimum/maximum parameter limits.
- Recompute border runs and corner joins against the actual room polygon.
- Reposition feature islands only within declared anchor/offset rules.
- Recalculate light positions from the fitted geometry and selected spacing rule.
- Preserve no-go zones around fans, chandeliers, access panels and services.
- Return a fit report showing changed parameters and why they changed.
- If no valid fit exists, do not silently distort the design: explain the conflict and offer compatible alternatives or manual-edit guidance.

### Required safety/quality checks
- Remaining clear ceiling height and local drops.
- Beam/column/slab conflicts and minimum clearance.
- Geometry self-intersections, gaps, invalid corners and out-of-room surfaces.
- Fixture/service clashes and access-panel reachability.
- Fan/chandelier/AC/curtain conflicts.
- Light spacing and cove continuity.
- Unsupported assumptions (unknown site levels, unverified services, missing fixture sizes).

Engineering thresholds must be configurable by approved construction standards and project specifications; do not invent universal structural or electrical limits. Flag for site/professional verification where required.

## 7. Generated onsite execution drawing package

Generate from the accepted model:

1. Reflected ceiling plan with room outline, ceiling zones, levels and legend.
2. Fully dimensioned ceiling layout with perimeter offsets, feature sizes and setting-out dimensions.
3. Ceiling drop/level plan and reference datum.
4. Sections through each distinct ceiling condition and critical transition.
5. Perimeter, cove, step, raft, island and bulkhead construction details as applicable.
6. Lighting layout with fixture IDs, types, positions, spacing and circuit/switch grouping where supplied.
7. Fan, chandelier, AC grille, curtain-track and service coordination plan.
8. Access-panel and maintenance-access locations.
9. Material, finish, profile, lighting and accessory schedule with quantities and status.
10. Site execution notes, assumptions, exclusions and verification requirements.

Drawings must state units, scale, project/room, revision, source model revision, issue status and date. A generated drawing is not an approval of structural, electrical, HVAC or fire-safety design. Those disciplines require qualified site/professional verification.

## 8. Reference ingestion and Pinterest synchronisation

Pinterest images are inspiration/reference inputs, not automatically executable construction templates.

Proposed workflow:
1. Ingest a pin URL/image and preserve source URL, title, creator/attribution and retrieval date where available.
2. Extract visible design attributes and classify style, room type, geometry, lighting and materials.
3. Mark unknown dimensions/construction as **not specified**; never infer them as fact from a photograph.
4. A designer/administrator creates or selects a parametric template and adds verified constraints/construction details.
5. Preview against test rooms, validate geometry and drawing outputs, then approve/publish as a library version.

Automatic board synchronisation is a future integration subject to Pinterest API availability, platform terms, authentication and permissions. A sync may create pending reference records, but must not publish unreviewed pins as production-ready parametric designs. If API access is unavailable, provide a controlled manual URL/image import.

## 9. Library administration and extensibility

- Admin/designer can create, clone, edit, archive and version a ceiling design without changing application code.
- Draft → review → approved → published → deprecated lifecycle.
- Published versions are immutable; changes create a new version.
- Support multiple reference images, material variants, room compatibility and regional execution notes.
- Validate schema, assets, geometry constraints and drawing mappings before publish.
- Keep source attribution and usage/rights metadata.
- Provide import/export of library packages with schema version and integrity checks.

## 10. UX requirements

- Dedicated **Ceiling Studio** workspace with a searchable/filterable visual catalogue.
- Cards show a representative image, name, style, suitable room types, complexity and typical drop.
- Design detail view shows gallery, 3D preview, plan/section, material and lighting options, execution notes and limitations.
- Clear **Fit to room** action, followed by a transparent fit summary.
- Side panel for grouped parameters; immediate preview with reset/undo.
- Persistent warnings panel with severity and direct navigation to the conflict.
- Toggle between plan, reflected ceiling plan, section and 3D without losing selection.
- Customer presentation mode hides technical clutter while preserving design revision identity.
- Responsive layout and keyboard-accessible controls; avoid tiny controls and excessive modal steps.

## 11. QA and acceptance gates

A template is not ready to publish until it passes:
- Schema validation and stable-ID/version checks.
- Fit tests in rectangular, square, narrow, large and irregular rooms.
- Minimum/maximum room and ceiling-height boundary tests.
- Beam, column, opening, fan, chandelier, AC, curtain and access-panel collision tests.
- Geometry validity, closed profiles, cove continuity and dimension consistency.
- Lighting spacing and fixture-count checks.
- Plan/section/3D dimensional consistency.
- Drawing regeneration after parameter edits.
- Save/reload, undo/redo, revision and export/import tests.
- Visual review by a designer and execution review by a qualified site professional for construction-critical details.

Release must not be described as bug-free. Report passed, failed, blocked and not-yet-tested cases separately.

## 12. Delivery sequence

**Phase A — foundation:** canonical ceiling model types, template schema, catalogue browser and a small set of clearly labelled generic starter templates.

**Phase B — fitting engine:** room polygon fit, parameter constraints, fit report and collision/clearance validation.

**Phase C — visualisation:** coordinated plan/RCP, sections and genuine 3D geometry from the same model.

**Phase D — documentation:** dimensioning, construction details, lighting/service coordination and schedules.

**Phase E — reference library:** review Pinterest screenshots, map each distinct reference to a design family, add approved templates and media.

**Phase F — administration/integration:** template editor, version lifecycle, optional Pinterest reference ingestion, customer presentation and ERP quotation adapter.

## 13. Initial implementation principles

- Keep this work inside `interior-studio/` and its documentation on `feature/interior-studio`.
- Do not modify legacy `studio/`, production ERP scripts or `main` as part of this foundation.
- Do not claim actual 3D, automatic fit, drawing generation or Pinterest sync until implemented and tested.
- Begin with reusable model/schema and a small representative catalogue; expand only after geometry and drawing tests pass.
