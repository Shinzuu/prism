/* Homepage contract. Rewritten 2026-09-29: the previous version asserted a
   30-entry two-column #grid that the sectioned redesign removed, so it had
   been failing against a page that was correct. */
import { chromium } from 'playwright';
import { allComponents, COMPONENT_TYPES } from '../src/lib/registry.js';

const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const fails = [];
const ck = (name, ok, detail = '') => {
  if (!ok) fails.push(`${name}${detail ? ` — ${detail}` : ''}`);
};

const total = allComponents().length;
const browser = await chromium.launch();
const pg = await browser.newPage({ viewport: { width: 1280, height: 900 } });
const errors = [];
pg.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 120)); });

await pg.goto(BASE, { waitUntil: 'networkidle' });
await pg.waitForTimeout(3000);

const cards = await pg.locator('.stack li').count();
ck('library: every component has a tile', cards === total, `${cards} tiles for ${total} components`);

const stacks = await pg.locator('.stack').count();
ck('library: one section per type', stacks === COMPONENT_TYPES.length, `${stacks} sections`);

/* Each type section must carry its own count, and those must sum to the whole
   library — a section that silently drops a component is the failure mode a
   sectioned gallery has that a flat list does not. */
const perSection = await pg.evaluate(() =>
  [...document.querySelectorAll('.stack')].map((s) => s.querySelectorAll('li').length));
ck('library: sections sum to the library', perSection.reduce((a, b) => a + b, 0) === total,
  perSection.join('+'));
ck('library: no empty section', perSection.every((n) => n > 0));

const previews = await pg.locator('iframe').count();
ck('library: every tile carries a preview', previews === total, `${previews} previews`);

// Search narrows, and says so when it finds nothing.
await pg.fill('#q', 'table');
await pg.waitForTimeout(300);
const narrowed = await pg.locator('.stack li:not([hidden])').count();
ck('search: narrows results', narrowed > 0 && narrowed < total, `${narrowed} shown for "table"`);

await pg.fill('#q', 'zzzzqqq');
await pg.waitForTimeout(300);
const none = await pg.locator('.stack li:not([hidden])').count();
ck('search: empty state', none === 0, `${none} still shown`);

await pg.fill('#q', '');
await pg.waitForTimeout(300);
const restored = await pg.locator('.stack li:not([hidden])').count();
ck('search: clearing restores every tile', restored === total, `${restored} restored`);

ck('library: no console errors', errors.length === 0, errors.slice(0, 2).join(' | '));

await browser.close();

if (fails.length) {
  console.error('library FAILED:\n  ' + fails.join('\n  '));
  process.exit(1);
}
console.log(`library clean — ${total} tiles across ${stacks} sections, search narrows and restores`);
