import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(here, '..');
const html = fs.readFileSync(path.join(appRoot, 'index.html'));
const server = http.createServer((req, res) => {
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, {'content-type':'text/html; charset=utf-8'});
    res.end(html);
  } else { res.writeHead(404); res.end('not found'); }
});
await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));

let browser;
try {
  browser = await chromium.launch({headless:true});
  const page = await browser.newPage({viewport:{width:1440,height:1000}});
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  await page.goto('http://127.0.0.1:4173');
  await page.evaluate(() => localStorage.removeItem('moducraft.interior-studio.v1'));
  await page.reload();
  assert.equal(await page.locator('.room').count(), 1, 'fresh project starts with one room');

  await page.locator('#projectName').fill('QA Apartment');
  await page.locator('#customer').fill('Test Customer');
  await page.locator('#customer').press('Tab');
  await page.locator('#addRoom').click();
  assert.equal(await page.locator('.room').count(), 2, 'add room creates a second room');

  await page.locator('#addBase').click();
  await page.locator('#addBase').click();
  assert.equal(await page.locator('[data-kind="module"]').count(), 2, 'module tools add two furniture objects');

  await page.locator('[data-view="checks"]').click();
  await page.locator('#checkDetail').waitFor();
  assert.ok((await page.locator('#checkDetail').innerText()).includes('overlaps'), 'overlap rule reports intersecting modules');

  await page.locator('[data-view="plan"]').click();
  await page.locator('#undo').click();
  assert.equal(await page.locator('[data-kind="module"]').count(), 1, 'undo reverts the latest module addition');
  await page.locator('#redo').click();
  assert.equal(await page.locator('[data-kind="module"]').count(), 2, 'redo restores the module addition');

  await page.locator('[data-view="plan"]').click();
  // The second module overlaps the first by design for the validation test;
  // click the topmost rendered SVG group so Playwright does not hit-test through it.
  await page.locator('[data-kind="module"]').last().click();
  await page.locator('#p_width').fill('950');
  await page.locator('#applyProps').click();
  await page.locator('#save').click();
  await page.reload();
  assert.equal(await page.locator('#projectName').inputValue(), 'QA Apartment', 'project name survives reload');
  assert.equal(await page.locator('#customer').inputValue(), 'Test Customer', 'customer survives reload');
  assert.equal(await page.locator('[data-kind="module"]').count(), 2, 'room modules survive reload');

  await page.locator('#decisionText').fill('Customer requested warmer shutter finish.');
  await page.locator('#recordDecision').click();
  assert.ok((await page.locator('#decisionLog').innerText()).includes('warmer shutter'), 'customer decision is recorded');

  await page.locator('#present').click();
  assert.equal(await page.locator('#modal').isVisible(), true, 'presentation preview opens');
  assert.ok((await page.locator('#presentation').innerText()).includes('QA Apartment'), 'presentation uses saved project data');
  await page.locator('#closeModal').click();

  const downloadPromise = page.waitForEvent('download');
  await page.locator('#export').click();
  const download = await downloadPromise;
  assert.ok(download.suggestedFilename().endsWith('.json'), 'project export creates JSON download');

  assert.deepEqual(pageErrors, [], 'no uncaught browser JavaScript errors');
  console.log('PASS: fresh start, multi-room, furniture placement, overlap validation, undo/redo, persistence, customer decision, presentation, JSON export, browser console.');
} finally {
  if (browser) await browser.close();
  await new Promise(resolve => server.close(resolve));
}
