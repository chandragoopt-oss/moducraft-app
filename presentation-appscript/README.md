# Standalone Module Studio Apps Script backend

This source belongs to a **new, standalone Apps Script project** owned by the Google account selected by Module Studio. It does not modify or import the existing ModuCraft web app, its existing Apps Script project, its preview, or `studio/`.

## Current stage — private setup only

1. Create the standalone project while signed into the intended Google account.
2. Copy `Code.gs` and `appsscript.json` from this folder into that project.
3. Save the project.
4. Run only `setupPresentationFolder` from the Apps Script editor and authorize Drive access. It creates (or reuses) a dedicated `Module Studio Presentations` folder in that account's Drive.

**Stop after the folder is created. Do not run `setupPresentationApiKey`. Do not deploy the script or connect it to the live application.**

## Security and integration gate

The initial API-key check is a temporary development placeholder, not production authentication. An API key embedded in browser JavaScript, local storage, a public repository, or a shared URL is not secure. Before any web deployment or live app connection, the backend must validate the existing ModuCraft session token on the server and enforce the user's role and project-level permissions. The existing production authentication service must remain unchanged.

The repository currently does not contain the source of the existing production Apps Script project. The integration contract cannot safely be completed until that backend's owner-approved source or a documented authentication/data API is available. Do not copy secrets, tokens, passwords, deployment URLs, or client records into GitHub or this chat.

## Implemented foundation

- Creates native Google Slides files inside the dedicated Drive folder.
- Validates required opening sequence: Cover, About Us, How We Work, Why Module Studio.
- Validates required closing sequence: Our Commitments, Quotation & Payment Milestones, Contact Us.
- Requires quotation number on First Design and Final Design presentations; does not require it on moodboards.
- Requires client, project, prepared-by and date metadata.
- Blocks prices in First Design; dimension checks are relaxed only on slides whose title identifies material/finish/specification content.
- Adds website text and page numbering in the footer.
- Validates the complete payload before creating a file and attempts to trash a partially rendered deck if rendering fails.

## Still outstanding before client use

- Confirm the official website spelling and add the approved Module Studio logo image to every slide.
- Replace provisional studio wording with approved About Us / How We Work / Why / Commitments text from the approved presentation PDFs.
- Load approved quotation, BOQ, scope, exclusions and payment milestones from the source of truth; never assume standard commercial terms where the project quotation differs.
- Add server-side identity and role validation using the existing app's authentication system.
- Add Drive asset upload, approved slide layouts, Google Slides edit/sync, PDF export and audit logging.
- Run browser, permission, failure-recovery and end-to-end tests.

## Existing preview decision

The existing `preview.html` / `preview-ui.js` sandbox and quotation `Preview / Print` view remain untouched. This module uses its own slide renderer and does not embed or repurpose either existing preview.
