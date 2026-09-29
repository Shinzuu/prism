/* /patterns and /logs are prose pages, so the failure mode is not a blank
   render — it is a lesson citing a component that moved, or a log whose
   sections parsed into the wrong headings. Both are invisible on the page. */
import { chromium } from 'playwright';
import { allLogs } from '../src/lib/logs.js';
import { allPatterns } from '../src/lib/patterns.js';
import { figureFor } from '../src/lib/log-figures.js';

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

  /* A figure is a claim. It has to exist exactly where the data exists, carry
     every row, and end up with a drawn bar — a chart whose bars never grow is
     worse than no chart, and it looks fine in the markup. */
  const fig = figureFor(l.week);
  if (fig) {
    /* The bars are grown when the figure reaches the reader, so the test has
       to behave like a reader: scroll to it, then let the tween finish. */
    await page.evaluate(() => document.querySelector('[data-fig]')?.scrollIntoView({ block: 'center' }));
    await page.waitForTimeout(1400);
  }
  const drawn = await page.evaluate(() => {
    const f = document.querySelector('[data-fig]');
    if (!f) return null;
    const bars = [...f.querySelectorAll('.fig__track i')];
    return {
      cap: f.querySelector('.fig__cap')?.textContent?.trim() ?? '',
      bars: bars.length,
      widest: Math.max(0, ...bars.map((b) => b.getBoundingClientRect().width)),
      zero: bars.filter((b) => b.getBoundingClientRect().width < 1).length,
    };
  });

  if (fig && !drawn) bad.push(`${l.slug}: has figure data but no figure rendered`);
  if (!fig && drawn) bad.push(`${l.slug}: renders a figure with no data behind it`);
  if (fig && drawn) {
    const want = fig.kind === 'bars' ? fig.bars.length : fig.rows.length * 2;
    if (drawn.bars !== want) bad.push(`${l.slug}: figure drew ${drawn.bars} bars, data has ${want}`);
    if (drawn.cap !== fig.title) bad.push(`${l.slug}: figure caption is "${drawn.cap}"`);
    if (drawn.widest < 40) bad.push(`${l.slug}: figure bars never grew (widest ${Math.round(drawn.widest)}px)`);
    if (drawn.zero) bad.push(`${l.slug}: ${drawn.zero} figure bars have no width`);
  }
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
const figures = logs.filter((l) => figureFor(l.week)).length;
console.log(`prose clean — ${patterns.length} lessons with ${cited.length} live citations, ${logs.length} agent logs, ${figures} measured figures`);
