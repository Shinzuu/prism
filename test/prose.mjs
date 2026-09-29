/* /patterns and /logs are prose pages, so the failure mode is not a blank
   render — it is a lesson citing a component that moved, or a log whose
   sections parsed into the wrong headings. Both are invisible on the page. */
import { chromium } from 'playwright';
import { allLogs } from '../src/lib/logs.js';
import { allPatterns } from '../src/lib/patterns.js';

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const logs = allLogs();
const patterns = allPatterns();
const bad = [];

const browser = await chromium.launch();
const page = await browser.newPage();

/* --- patterns ------------------------------------------------------------ */
await page.goto(`${SITE}/patterns`, { waitUntil: 'load' });

const seen = await page.evaluate(() =>
  [...document.querySelectorAll('.pt__sec')].map((s) => ({
    id: s.id,
    heading: s.querySelector('h2')?.textContent?.trim() ?? '',
    paras: s.querySelectorAll('.pt__p').length,
    links: [...s.querySelectorAll('.pt__ev a')].map((a) => a.getAttribute('href')),
  })),
);

if (seen.length !== patterns.length) {
  bad.push(`patterns: page shows ${seen.length} lessons, source has ${patterns.length}`);
}
for (const [i, l] of patterns.entries()) {
  const s = seen[i];
  if (!s) { bad.push(`patterns: lesson "${l.id}" missing from page`); continue; }
  if (s.id !== l.id) bad.push(`patterns: lesson ${i} is "${s.id}", expected "${l.id}"`);
  if (s.heading !== l.title) bad.push(`patterns: "${l.id}" heading is "${s.heading}"`);
  if (s.paras !== l.claim.length) bad.push(`patterns: "${l.id}" shows ${s.paras} claim paragraphs, expected ${l.claim.length}`);
  if (s.links.length !== l.evidence.length) bad.push(`patterns: "${l.id}" shows ${s.links.length} evidence links, expected ${l.evidence.length}`);
}

/* Every citation has to resolve. A lesson that points at a 404 is a broken
   argument, and the page gives no sign of it. */
const cited = [...new Set(patterns.flatMap((l) => l.evidence.map((e) => `/components/${e.slug}`)))];
for (const href of cited) {
  const r = await page.request.get(`${SITE}${href}`);
  if (!r.ok()) bad.push(`patterns: citation ${href} returned ${r.status()}`);
}

/* --- logs ---------------------------------------------------------------- */
await page.goto(`${SITE}/logs`, { waitUntil: 'load' });
const rows = await page.evaluate(() => document.querySelectorAll('.lg__row').length);
if (rows !== logs.length) bad.push(`logs: index lists ${rows} logs, source has ${logs.length}`);

for (const l of logs) {
  await page.goto(`${SITE}/logs/${l.slug}`, { waitUntil: 'load' });
  const got = await page.evaluate(() => ({
    h1: document.querySelector('h1')?.textContent?.trim() ?? '',
    heads: [...document.querySelectorAll('.al__sec h2')].map((h) => h.textContent.trim()),
    bodies: [...document.querySelectorAll('.al__body')].map((b) => b.textContent.trim().length),
  }));

  if (got.h1 !== l.task) bad.push(`${l.slug}: h1 is "${got.h1.slice(0, 40)}", expected the task line`);

  /* A header that leaked into the body, or a body that swallowed the next
     header, both show up as a section count that disagrees with the parse. */
  const expected = [['Prompt or workflow', l.prompt], ['Result', l.result], ['What it saved', l.saved]]
    .filter(([, body]) => body)
    .map(([h]) => h);
  if (got.heads.join('|') !== expected.join('|')) {
    bad.push(`${l.slug}: sections are [${got.heads}], expected [${expected}]`);
  }
  if (got.bodies.some((n) => n < 60)) bad.push(`${l.slug}: a section body is nearly empty`);
  /* The prompt is the part of a log that cannot be missing. */
  if (!got.heads.includes('Prompt or workflow')) bad.push(`${l.slug}: no prompt section rendered`);
}

/* --- nav ----------------------------------------------------------------- */
await page.goto(SITE, { waitUntil: 'load' });
const nav = await page.evaluate(() =>
  [...document.querySelectorAll('.mast__nav a')].map((a) => a.getAttribute('href')),
);
for (const href of ['/patterns', '/logs']) {
  if (!nav.includes(href)) bad.push(`nav: ${href} is not linked from the masthead`);
}

await browser.close();

if (bad.length) {
  console.error(`prose: ${bad.length} problems\n  ` + bad.join('\n  '));
  process.exit(1);
}
console.log(`prose clean — ${patterns.length} lessons with ${cited.length} live citations, ${logs.length} agent logs`);
