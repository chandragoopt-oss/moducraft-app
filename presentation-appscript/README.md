# Standalone Module Studio Apps Script backend

This is source code for a NEW standalone Google Apps Script project. It is not bound to the existing ModuCraft spreadsheet or web app and does not edit the current app, its preview, or `studio/`.

## Ownership and access
Create the script while signed into the Google account that should own Module Studio presentation files. Keep the script private to that account. Do not publish the project source or API key in a public repository. The repository copy is source control only; the deployed script belongs to the Google account that creates it.

## Create the project
1. Sign in to the intended Google account.
2. Open https://script.google.com/home/start and create a **New project** named `Module Studio Presentation Builder API`.
3. Copy `Code.gs` into the editor.
4. Open Project Settings and enable `Show "appsscript.json" manifest file in editor`; replace the manifest with this folder's `appsscript.json`.
5. Save. Run `setupPresentationFolder` and authorize Drive access. This creates a dedicated `Module Studio Presentations` folder in that account's Drive.
6. Run `setupPresentationApiKey` and authorize. Copy the logged key to a secure server-side secret store. Never place it in browser JavaScript or commit it to GitHub.
7. Deploy > New deployment > Web app. Execute as **Me**. Restrict access to the intended users / signed-in Google account where the account's Workspace settings allow it. Do not select public anonymous access for production.
8. Keep the deployment URL and Script ID private. Configure them in server-side environment settings, not client-side source.

## Initial API
- GET `?action=health` — unauthenticated health response only.
- POST JSON `{ action: "health", apiKey: "..." }`
- POST JSON `{ action: "createPresentation", apiKey, client, project, type, quotationNumber?, slides: [{title, body}] }`
- POST JSON `{ action: "listPresentations", apiKey }`

The first version creates native Google Slides files in the dedicated folder. It is a minimal backend foundation, not the complete production integration. Before exposing it to the web app, add server-side identity verification, per-user authorization, request validation, rate limiting, audit logging and quotation data integration. The API key alone is not sufficient authentication for a public deployment.

## Current limitations
- This first endpoint accepts slide content from a trusted caller; it does not yet enforce the mandatory page order or project-specific commercial rules server-side.
- It does not yet generate PDF exports, copy image assets, synchronize later edits, or query quotation/BOQ data.
- The visual rendering is intentionally minimal and needs to be replaced with the approved Module Studio slide layouts.
- Do not use real client data until access controls and the final approved content are in place.
