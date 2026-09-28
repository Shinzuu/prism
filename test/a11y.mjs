/* axe pass over every component. The components carry hand-written ARIA and
   keyboard paths that were each checked individually; nothing had ever run a
   rules engine across all of them at once. */
import { chromium } from 'playwright';
import { createRequire } from 'node:module';
import { allComponents } from '../src/lib/registry.js';

const require = createRequire(import.meta.url);
const axePath = require.resolve('axe-core/axe.min.js');
const axeSource = require('node:fs').readFileSync(axePath, 'utf8');

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 420 } });
const all = allComponents();
const found = [];

for (const c of all) {
  await page.goto(`${SITE}/preview/${c.slug}`, { waitUntil: 'load' });
  await page.waitForTimeout(350);
  await page.addScriptTag({ content: axeSource });
  const res = await page.evaluate(async () => {
    // Serious and critical only: the rest is noise on a preview fragment with
    // no page landmarks of its own.
    /* color-contrast is by far the most expensive rule and it re-derives what
       contrast.mjs already checks at the token level, so it is disabled here.
       Everything else in wcag2a/wcag2aa stays. */
    const r = await window.axe.run('#fit-inner', {
      resultTypes: ['violations'],
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'best-practice'] },
      rules: { 'color-contrast': { enabled: false } },
    });
    return r.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => ({ id: v.id, impact: v.impact, n: v.nodes.length,
                     sample: v.nodes[0]?.html?.slice(0, 70) ?? '' }));
  });
  for (const v of res) found.push(`${c.slug}: [${v.impact}] ${v.id} ×${v.n} — ${v.sample}`);
}

await browser.close();
if (found.length) {
  console.error(`a11y: ${found.length} serious/critical findings\n  ` + found.slice(0, 25).join('\n  '));
  process.exit(1);
}
console.log(`a11y clean — ${all.length} components, no serious or critical axe violations`);
