/* Smoke-test every component in a real browser: does it mount, does it render
   something, and does it run without throwing. */
import { chromium } from 'playwright';
import { allComponents } from '../src/lib/registry.js';

const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const b = await chromium.launch();
let bad = 0;

for (const c of allComponents()) {
  const p = await b.newPage({ viewport: { width: 900, height: 600 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(`${BASE}/preview/${c.slug}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(900);

  const info = await p.evaluate(() => {
    /* Bounded. Spreading querySelectorAll('*') and measuring each element
       walks 250,000 nodes on endless-ledger and never returns — the same trap
       that hung qa.mjs. The question here is "did anything paint", and the
       first few hundred elements answer it as well as all of them. */
    const CAP = 400;
    let painted = 0, seen = 0;
    const walk = (node, depth) => {
      if (seen >= CAP || depth > 12) return;
      for (const el of node.children) {
        if (seen++ >= CAP) return;
        const r = el.getBoundingClientRect();
        if (r.width > 4 && r.height > 4) painted++;
        const o = getComputedStyle(el);
        if (o.overflow === 'visible' && o.overflowX === 'visible' && o.overflowY === 'visible') {
          walk(el, depth + 1);
        }
      }
    };
    walk(document.body, 0);
    // innerText on a 50,000-row body forces a full layout; take a slice.
    const text = (document.querySelector('#fit-inner')?.textContent ?? '').slice(0, 4000).trim().length;
    const svg = document.querySelectorAll('svg').length;
    return { painted, text, svg };
  });

  const ok = info.painted >= 3 && (info.text > 0 || info.svg > 0) && errs.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.slug.padEnd(20)} ${String(info.painted).padStart(3)} elements, ${String(info.text).padStart(4)} chars${errs.length ? '  ERR: ' + errs[0].slice(0, 70) : ''}`);
  await p.close();
}

await b.close();
const total = allComponents().length;
console.log(bad ? `\n${bad} of ${total} component(s) failed` : `\nall ${total} components mount and run clean`);
process.exit(bad ? 1 : 0);
