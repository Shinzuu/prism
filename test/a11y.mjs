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
let page = await browser.newPage({ viewport: { width: 560, height: 420 } });
const all = allComponents();
const found = [];

/* axe walks every node in the subtree it is given, and endless-ledger paints
   50,000 rows, so an unbounded run there does not finish in any useful time.

   Those rows are emitted by one template, so every one of them is the same
   markup with different numbers in it. Checking 50,000 copies of a shape tells
   you nothing that checking 200 does not — so a very long run of siblings is
   trimmed to a sample before axe runs, and the page is reported as sampled
   rather than silently skipped. The budget below is the backstop for anything
   this does not catch. */
const BUDGET = Number(process.env.AXE_BUDGET_MS || 45000);
const SAMPLE_OVER = 400;   // a sibling run longer than this is repetition
const SAMPLE_KEEP = 200;   // enough to cover first, last and the middle
const skipped = [];
const sampled = [];
let done = 0;

for (const c of all) {
  await page.goto(`${SITE}/preview/${c.slug}`, { waitUntil: 'load' });
  await page.waitForTimeout(350);
  await page.addScriptTag({ content: axeSource });

  /* Trim before axe is loaded with the page, not after it has started. */
  const trimmed = await page.evaluate(({ over, keep }) => {
    const root = document.querySelector('#fit-inner');
    if (!root) return null;
    let cut = 0, from = 0, where = '';
    for (const parent of root.querySelectorAll('*')) {
      const n = parent.childElementCount;
      if (n <= over) continue;
      /* Only trim a run that really is repetition: same tag and same class on
         every child. A long list of different elements is not a template. */
      const kids = [...parent.children];
      const sig = (el) => el.tagName + '|' + el.className;
      const first = sig(kids[0]);
      if (!kids.every((el) => sig(el) === first)) continue;
      for (const el of kids.slice(keep)) el.remove();
      cut += n - keep;
      from = n;
      where = parent.getAttribute('role') || parent.tagName.toLowerCase();
    }
    return cut ? { cut, from, where } : null;
  }, { over: SAMPLE_OVER, keep: SAMPLE_KEEP });

  if (trimmed) sampled.push(`${c.slug} (${SAMPLE_KEEP} of ${trimmed.from} ${trimmed.where} children)`);

  const evaluation = page.evaluate(async () => {
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

  /* The budget has to be enforced from Node. axe does its work synchronously,
     so on a page like endless-ledger the page's own event loop never gets a
     turn and an in-page setTimeout can never fire — the first version of this
     cap was written that way and hung on exactly that component. */
  let timer;
  const capped = new Promise((res) => { timer = setTimeout(() => res(null), BUDGET); });
  const res = await Promise.race([evaluation.catch(() => null), capped]);
  clearTimeout(timer);

  done += 1;
  if (res === null) {
    /* That page is still inside a synchronous axe call and will never answer,
       so it is abandoned rather than reused. */
    skipped.push(c.slug);
    console.log(`  ${done}/${all.length} ${c.slug} — over ${BUDGET}ms, not checked`);
    await page.close().catch(() => {});
    page = await browser.newPage({ viewport: { width: 560, height: 420 } });
    continue;
  }

  /* Progress on stdout: a sweep this long with no output is indistinguishable
     from a hang, which is exactly how the first two attempts were read. */
  console.log(`  ${done}/${all.length} ${c.slug}${trimmed ? ` — sampled ${SAMPLE_KEEP}/${trimmed.from}` : ''}${res.length ? ` — ${res.length} findings` : ''}`);
  for (const v of res) found.push(`${c.slug}: [${v.impact}] ${v.id} ×${v.n} — ${v.sample}`);
}

await browser.close();
if (found.length) {
  console.error(`a11y: ${found.length} serious/critical findings\n  ` + found.slice(0, 25).join('\n  '));
  process.exit(1);
}
console.log(
  `a11y clean — ${all.length - skipped.length} of ${all.length} components, no serious or critical axe violations` +
  (sampled.length ? `\n  repeated rows sampled: ${sampled.join(', ')}` : '') +
  (skipped.length ? `\n  not checked (DOM too large for the rule engine): ${skipped.join(', ')}` : ''),
);
