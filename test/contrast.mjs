import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(1200);

const out = await p.evaluate(() => {
  // Paint each token to a canvas and read the pixel: the only reliable way to
  // resolve oklch() to sRGB, since the browser serialises it unchanged.
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  const cs = getComputedStyle(document.documentElement);
  const rgb = (tok) => {
    ctx.clearRect(0, 0, 1, 1);
    ctx.fillStyle = cs.getPropertyValue(tok).trim();
    ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  };
  const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const lum = ([r, g, bl]) => 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(bl);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); const hi = Math.max(x, y), lo = Math.min(x, y); return (hi + 0.05) / (lo + 0.05); };
  const pairs = [
    ['--text', '--bg', 4.5], ['--text-dim', '--bg', 4.5], ['--text', '--surface', 4.5],
    ['--accent', '--bg', 3], ['--accent-fg', '--accent', 4.5], ['--border', '--bg', 1.3]
  ];
  return pairs.map(([fg, bg, floor]) => ({
    pair: `${fg} on ${bg}`, ratio: +ratio(rgb(fg), rgb(bg)).toFixed(2), floor,
    pass: ratio(rgb(fg), rgb(bg)) >= floor,
    fg: rgb(fg).join(','), bg: rgb(bg).join(',')
  }));
});
let bad = 0;
for (const r of out) {
  if (!r.pass) bad++;
  console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${r.pair.padEnd(26)} ${String(r.ratio).padStart(6)}:1  (floor ${r.floor})  rgb(${r.fg}) on rgb(${r.bg})`);
}
console.log(bad ? `\n${bad} pair(s) below floor` : '\nevery pair clears its floor');
await b.close();
process.exit(bad ? 1 : 0);
