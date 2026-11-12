# ModuCraft — Non-disruptive Google Workspace migration

Status: preparation started; no production endpoint, spreadsheet, Apps Script deployment, or live data has been changed.

## Scope and ownership

- Designated destination/administration account: `databasemoducraft@gmail.com`.
- Current repository: `chandragoopt-oss/moducraft-app`.
- Preparation branch: `migration/google-account-shadow`.
- Source development branch: `feature/interior-studio`.
- Do not merge this branch into `main` or deploy it as part of migration preparation.
- The existing live app remains on its current deployment and current Apps Script endpoint until an explicit, tested cutover is approved.

## Initial repository inspection

The current `feature/interior-studio` branch's `index.html` contains a Google Sheets database adapter that calls an existing Apps Script Web App. `auth.js` also calls that same Web App for login and user administration. This confirms that the current online app is coupled to the existing Apps Script deployment.

The adapter currently implements a five-second polling loop in `onSnapshot`. This must be addressed in a separate, tested change because the engineering brief prohibits polling (OPS-007). Do not combine that correction with data migration or change live behaviour during the shadow-copy phase.

The frontend contains client-side role/permission convenience logic. Actual authorization must be verified in the Apps Script backend; frontend checks are not a security boundary (SEC family). Do not assume the live backend is secure until its source is reviewed.

No credentials, API keys, tokens, or private deployment URLs should be copied into migration documentation or committed to Git.

## Zero-downtime migration method

1. **Freeze and inventory (read-only):** identify every production spreadsheet, tab/schema, Apps Script project, deployment, trigger, property, user/role record, and external integration. Record owners, IDs, row counts, and last-modified timestamps in a private migration register.
2. **Protect source:** make timestamped, access-restricted backups of each source spreadsheet and Apps Script source. Preserve the currently deployed Web App version. Do not rename, move, delete, or change sharing on production assets.
3. **Prepare destination:** under `databasemoducraft@gmail.com`, create destination copies/projects with restricted access. Keep production and destination IDs distinct. Do not expose destination URLs to the live app.
4. **Shadow copy:** copy data from source to destination without changing production writes. Use stable record IDs, deterministic mapping, checksums, row counts, and duplicate detection. Re-running the import must be idempotent.
5. **Reconcile:** compare source and destination by entity, record ID, counts, required fields, relationships, rates, timestamps, and sampled full records. Preserve historical quotation snapshots and issued document values exactly.
6. **Shadow validation:** test the destination backend independently using test users and test projects. Verify CRUD, role authorization, catalogue reads, rate snapshots, backups, restore, and failure recovery. No production user traffic is routed to it.
7. **Controlled cutover (later, only after approval):** briefly gate writes or use a documented change-log/outbox catch-up, reconcile the final delta, switch the app configuration to the new deployment, run smoke tests, and keep the old deployment/data intact for rollback.
8. **Rollback:** if any smoke test or reconciliation fails, switch the app configuration back to the old deployment. Never delete or overwrite the source during the rollback window.

## Non-negotiable safeguards

- No changes to the live Apps Script deployment, production spreadsheet, live endpoint, or production app configuration during inventory and shadow copy.
- No direct production dual-write until an idempotent write protocol, conflict policy, and reconciliation are implemented and tested.
- Never auto-merge conflicting dimensions or rates (OFF-005).
- Historical quotations and approved revisions remain immutable (INV-02, INV-04, INV-17).
- Keep computation client-side (ARC-008); the backend stores, authorizes, and synchronizes.
- Keep the existing ERP/catalogue source of truth and link/fetch its current module, accessory, material, hardware, and rate lists; do not create duplicate catalogue entries.
- Use least-privilege access; do not make spreadsheets or Apps Script endpoints public to simplify migration.
- Migration is not complete until a tested restore and rollback have succeeded.

## Access and inputs required before copying real data

The GitHub repository connection does not grant access to Google Drive, Sheets, or Apps Script. The destination Google account must explicitly share the source assets and grant the required access, or the owner must provide the source spreadsheet IDs and Apps Script project/deployment details through a secure channel. Do not send passwords, OAuth refresh tokens, or API secrets in chat or commit them to Git.

Required inventory:
- Source spreadsheet IDs and names, with the tabs used by the live app.
- Apps Script project ID and source access; current deployment/version and web-app execution/access settings.
- Trigger list, Script Properties, and any referenced Drive folders.
- Production hosting URL/provider and the exact deployed Git commit/branch.
- ERP/catalogue connection details and the authoritative module/material/rate source.
- Approved list of destination administrators and the three team members' roles.

## Completion gates

- Source and destination record counts match, with no unexplained missing or duplicate IDs.
- All historical quotation/rate snapshots match exactly.
- Referential integrity and role-based authorization tests pass.
- A clean restore from destination backup succeeds.
- Desktop/web clients pass integration tests against the destination.
- Production cutover and rollback are rehearsed before any live switch.

Until these gates pass, the current online app remains connected to its existing backend.
