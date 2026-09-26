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
    const body = document.body;
    const painted = [...body.querySelectorAll('*')].filter((el) => {
      const r = el.getBoundingClientRect();
      return r.width > 4 && r.height > 4;
    }).length;
    const text = body.innerText.trim().length;
    const svg = document.querySelectorAll('svg').length;
    return { painted, text, svg };
  });

  const ok = info.painted >= 3 && (info.text > 0 || info.svg > 0) && errs.length === 0;
  if (!ok) bad++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.slug.padEnd(20)} ${String(info.painted).padStart(3)} elements, ${String(info.text).padStart(4)} chars${errs.length ? '  ERR: ' + errs[0].slice(0, 70) : ''}`);
  await p.close();
}

await b.close();
console.log(bad ? `\n${bad} component(s) failed` : '\nall 30 components mount and run clean');
process.exit(bad ? 1 : 0);
