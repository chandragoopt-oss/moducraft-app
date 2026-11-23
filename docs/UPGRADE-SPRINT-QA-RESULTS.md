# ModuCraft Upgrade Sprint — QA Evidence & Recovery Notes

**Date:** 23 November 2026  
**Repository:** chandragoopt-oss/moducraft-app  
**Branch:** upgrade-sprint/knowledge-and-feature-consolidation  
**Workflow run:** 45222545788 — completed successfully  
**Commit:** ba323bd8c9b6a08b750d89dae571b3c229fa3cf8

## Fresh CI evidence

Both jobs in the sprint QA workflow passed:

- **studio-browser-smoke — SUCCESS**
  - Dependencies installed
  - Playwright Chromium installed
  - `npm test` completed
  - Smoke suite reported PASS for fresh start, multi-room, furniture placement, overlap validation, undo/redo, persistence, customer decision, presentation, JSON export and browser console.
- **presentation-static-check — SUCCESS**
  - JavaScript syntax checks passed for `presentation/js/app.js` and `presentation/js/templates.js`
  - Entry point and CSS existence checks passed.

Run URL: https://github.com/chandragoopt-oss/moducraft-app/actions/runs/45222545788

This is fresh branch CI evidence only; it is not proof of production deployment, backend/security readiness, cross-account permission correctness, mobile-device QA, DXF/PDF export quality or live ERP sync.

## Sprint branch work verified

- Source baseline document committed.
- ModuleStudio presentation-builder assets imported additively.
- Sprint QA workflow committed.
- The branch remains isolated. No PR, merge, release or deployment has been performed.

## Office automation recovery findings

Read-only audit of the Activepieces project shows:

- 13 flows listed; 12 enabled and 1 disabled draft.
- 7 active project connections: GitHub, Notion (two connections), Claude, Google Sheets, Google Drive and Dropbox.
- Office Task Ledger table exists with 15 records.
- Daily Ledger Digest has two successful recent production runs.
- The Office Coordinator and PA/GM/departmental flows are configured with AI steps; dispatching tests are blocked by exhausted Activepieces credits.
- Existing ledger evidence distinguishes synthetic coordinator testing and archive success from verified live employee dispatch. No live private-employee execution is claimed.

## Security remediation item — priority

Webhook flow configurations exposed a shared header secret during read-only inspection. The secret is not included here. Treat it as compromised: rotate it at the source and update each dependent caller/flow only after a coordinated owner-controlled change, then verify. Do not re-use or share the exposed value.

## Remaining sprint gates

- Reconcile source documents and archive coverage; source corpus remains incomplete.
- Audit parity across ERP Design, Interior Studio variants, presentation builder and legacy surfaces.
- Review Studio regression coverage and gaps, especially geometry, ceilings, per-unit detail sheets, DXF/PDF, approvals and commercial integration boundaries.
- Verify security/auth/persistence architecture and cross-account behavior.
- Validate mobile and actual device/browser performance.
- Run synthetic end-to-end acceptance project with reviewed ERP adapter boundaries.
- Prepare a review PR only after evidence and unresolved gaps are documented; do not merge/deploy without owner approval.
