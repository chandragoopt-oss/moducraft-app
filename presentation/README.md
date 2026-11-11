# Module Studio Presentation Builder

An isolated, static-JavaScript module scaffold for ModuCraft. It is intentionally located under `presentation/` and does not import, modify, or depend on `studio/`.

## Current scope
- Independent entry point: `presentation/index.html`
- Dashboard, template catalogue, new-presentation wizard and slide workspace
- Moodboard, First Design and Final Design document types
- Mandatory studio opening pages and closing pages
- Editable project slide text, project-slide insertion and in-section reordering
- Browser-local draft persistence and initial structure validation

## Important limitations in this scaffold
This is a first isolated UI implementation, not the production-integrated release. Drafts are currently stored in the browser's localStorage. It does not yet connect to the existing Google Apps Script backend, Google Sheets, Google Drive, Google Slides, quotation/BOQ records, authentication roles or PDF export. The fixed studio copy is provisional and must be reviewed against the approved master wording before client use. The commercial terms must be loaded from the approved project quotation before sharing.

## Safety boundary
- Do not add imports or script references from `studio/`.
- Do not edit root application files to expose this module until the isolated route has been tested.
- Keep changes on `feature/module-studio-presentation-builder` and merge only through review.
- No deployment or production configuration is changed by this branch.

## Run locally
Open `presentation/index.html` in a browser, or serve the repository root with any static file server and navigate to `/presentation/`.

## Next integration requirements
1. Confirm the owner-controlled Google Drive account and destination folder.
2. Provide access to the existing Apps Script project source and deployment owner workflow.
3. Define the exact quotation/BOQ collection schema and read-only lookup contract.
4. Replace provisional fixed-page text with approved brand master content.
5. Add server-side role validation, Slides generation/sync, Drive asset management and PDF export.
6. Add automated browser tests and deploy the standalone route before adding any main-app navigation entry.
