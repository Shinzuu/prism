/* Dark mode has not been checked since the Tailwind migration. The palette is
   token-driven, so the risk is not that a colour is wrong — it is that some
   component hardcoded a light assumption that survives the token swap. */
import { chromium } from 'playwright';
import { allComponents } from '../src/lib/registry.js';

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 560, height: 420 }, colorScheme: 'dark' });
const bad = [];
const all = allComponents();

const lum = (rgb) => {
  const [r, g, b] = (rgb.match(/[\d.]+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;   // 0-255, good enough to tell dark from light
};

for (const c of all) {
  await page.goto(`${SITE}/preview/${c.slug}`, { waitUntil: 'load' });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.waitForTimeout(500);

  const seen = await page.evaluate(() => {
    const root = document.querySelector('#fit-inner');
    const out = [];
    let n = 0;
    const walk = (node, d) => {
      if (n > 120 || d > 8) return;
      for (const el of node.children) {
        if (n++ > 120) return;
        const s = getComputedStyle(el);
        out.push({ bg: s.backgroundColor, fg: s.color });
        walk(el, d + 1);
      }
    };
    walk(root ?? document.body, 0);
    return { body: getComputedStyle(document.body).backgroundColor, els: out };
  });

  // In dark mode the page ground must be dark; a light ground means a
  // component painted over the token instead of through it.
  if (lum(seen.body) > 120) bad.push(`${c.slug}: body ground is light (${seen.body})`);
  const lightBlocks = seen.els.filter((e) => {
    const a = (e.bg.match(/[\d.]+/g) ?? [])[3];
    return a !== '0' && e.bg !== 'rgba(0, 0, 0, 0)' && lum(e.bg) > 190;
  });
  if (lightBlocks.length > 2) bad.push(`${c.slug}: ${lightBlocks.length} light-filled elements, e.g. ${lightBlocks[0].bg}`);
}

await browser.close();
if (bad.length) {
  console.error(`dark FAILED (${bad.length}/${all.length}):\n  ` + bad.slice(0, 12).join('\n  '));
  process.exit(1);
}
console.log(`dark clean — ${all.length} components keep a dark ground and no light-painted blocks`);
