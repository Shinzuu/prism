/* Every component's own page must actually run the component.
   Added 2026-09-29 after the detail pages shipped a blank stage for all 70:
   the workbench assembled its preview from html/css/js panes that no longer
   existed once the components became .tsx, and nothing checked that the frame
   had anything in it. The page rendering is not the same claim as the preview
   route rendering, and only the second was being tested. */
import { chromium } from 'playwright';
import { allComponents } from '../src/lib/registry.js';

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const all = allComponents();
const bad = [];

for (const c of all) {
  await page.goto(`${SITE}/components/${c.slug}`, { waitUntil: 'load' });
  await page.waitForTimeout(650);

  let inner = 0;
  for (const fr of page.frames().slice(1)) {
    try { inner = Math.max(inner, await fr.evaluate(() => document.querySelector('#fit-inner')?.innerHTML.length || 0)); }
    catch { /* frame still navigating */ }
  }
  const id = await page.evaluate(() => document.querySelector('[data-use-id]')?.textContent ?? '');

  if (inner < 80) bad.push(`${c.slug}: demo frame is empty`);
  else if (id !== c.slug) bad.push(`${c.slug}: element id reads "${id}"`);
}

await browser.close();

if (bad.length) {
  console.error(`pages FAILED (${bad.length}/${all.length}):\n  ` + bad.slice(0, 12).join('\n  '));
  process.exit(1);
}
console.log(`pages clean — ${all.length} detail pages each run their component and expose their element id`);
