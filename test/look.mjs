/* Side-by-side visual review: one strip, three viewports, so a whole
   breakpoint set can be judged in a single image. */
import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const PATH = process.argv[2] || '/';
const SCROLL = +(process.argv[3] || 0);
const SIZES = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 834, height: 900 },
  { name: 'phone', width: 390, height: 844 }
];

const b = await chromium.launch();
const shots = [];
for (const s of SIZES) {
  const p = await b.newPage({ viewport: { width: s.width, height: s.height } });
  await p.goto(BASE + PATH, { waitUntil: 'networkidle' });
  await p.waitForTimeout(5200);
  if (SCROLL) { await p.evaluate((y) => window.scrollTo(0, y), SCROLL); await p.waitForTimeout(1200); }
  const buf = await p.screenshot();
  shots.push({ ...s, b64: buf.toString('base64') });
  await p.close();
}

// stitch in a headless page so no image library is needed
const p = await b.newPage({ viewport: { width: 1480, height: 1000 } });
const total = SIZES.reduce((n, s) => n + s.width, 0);
const scale = 1400 / total;
await p.setContent(`<body style="margin:0;background:#1b1b1b;display:flex;gap:12px;padding:12px;align-items:flex-start">
${shots.map(s => `<figure style="margin:0;flex:0 0 ${Math.round(s.width * scale)}px">
  <img src="data:image/png;base64,${s.b64}" style="width:100%;display:block;border:1px solid #444">
  <figcaption style="font:11px system-ui;color:#999;padding-top:4px">${s.name} · ${s.width}px</figcaption>
</figure>`).join('')}
</body>`);
await p.waitForTimeout(400);
const out = `test/review${PATH.replace(/\//g, '-') || '-home'}${SCROLL ? '-' + SCROLL : ''}.png`;
await p.screenshot({ path: out, fullPage: true });
await b.close();
console.log('wrote', out);
