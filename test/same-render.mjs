/* Does every component still render the same with no props?

   Moving hardcoded values into props must not change what <X /> draws, because
   the gallery and the detail pages mount every component with no props. This
   screenshots each preview twice, once from the deployed site (OLD) and once
   from a local build (NEW), and counts the pixels that differ.

   Animation is the noise source, so motion is reduced and each frame is given
   time to settle. A component that animates regardless will show a small diff;
   anything above the threshold is listed for a person to look at.

   OLD=https://prism.shinzuu-dev.workers.dev NEW=http://localhost:4321 node test/same-render.mjs */
import { chromium } from 'playwright';
import { readdirSync, existsSync } from 'node:fs';

const OLD = process.env.OLD || 'https://prism.shinzuu-dev.workers.dev';
const NEW = process.env.NEW || 'http://localhost:4321';
const LIMIT = Number(process.env.LIMIT || 0.002);   // share of pixels allowed to differ

const slugs = readdirSync('components-src')
  .filter((d) => !d.startsWith('_') && existsSync(`components-src/${d}/Component.tsx`))
  .sort();

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 900, height: 700 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const cmp = await ctx.newPage();

async function shot(base, slug) {
  await page.goto(`${base}/preview/${slug}`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(700);
  return (await page.screenshot({ fullPage: false })).toString('base64');
}

/* Decode both PNGs in a canvas and count differing pixels. No image library
   needed: the browser already has a PNG decoder. */
async function diff(a, b) {
  return cmp.evaluate(async ([a, b]) => {
    const load = (s) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = 'data:image/png;base64,' + s; });
    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return 1;
    const c = document.createElement('canvas'); c.width = ia.width; c.height = ia.height;
    const g = c.getContext('2d');
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, c.width, c.height).data;
    g.clearRect(0, 0, c.width, c.height);
    g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 24) n++;
    }
    return n / (da.length / 4);
  }, [a, b]);
}

const changed = [];
for (const [i, slug] of slugs.entries()) {
  const d = await diff(await shot(OLD, slug), await shot(NEW, slug));
  const mark = d > LIMIT ? 'DIFF' : 'same';
  if (d > LIMIT) changed.push(`${slug} ${(d * 100).toFixed(2)}%`);
  console.log(`${String(i + 1).padStart(2)}/${slugs.length} ${mark} ${slug} ${(d * 100).toFixed(3)}%`);
}
await browser.close();

if (changed.length) {
  console.log(`\n${changed.length} component(s) render differently with no props:\n  ${changed.join('\n  ')}`);
  process.exit(1);
}
console.log(`\nsame render — ${slugs.length} components draw what they drew before`);
