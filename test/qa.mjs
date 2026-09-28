/* Visual QA. Structural tests confirm what the author intended; these check
   what a person would actually see. Every rule here exists because a real bug
   got past a green suite. */
import { chromium } from 'playwright';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { allComponents } from '../src/lib/registry.js';

const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const fails = [];
const fail = (rule, detail) => fails.push(`${rule}: ${detail}`);

/* ---------- 1. token collisions, no browser needed ----------
   A component using --h or --c as a local variable silently inherits the hue
   and chroma tokens. This is what made one grid span 35 rows. */
const TOKENS = ['h','c','ha','ca','bg','surface','raised','border','text','text-dim',
  'accent','accent-fg','accent-dim','radius','radius-sm','rule','shadow','sans','mono','display','measure'];
for (const dir of readdirSync('components-src').filter((d) => !d.startsWith('_'))) {
  for (const f of ['style.css', 'index.html', 'script.js']) {
    const p = join('components-src', dir, f);
    if (!existsSync(p)) continue;
    const src = readFileSync(p, 'utf8');
    for (const t of TOKENS) {
      // a local *declaration* of a token name is the dangerous case
      const decl = new RegExp(`(^|[;{"'\\s])--${t}\\s*:`, 'm');
      if (decl.test(src)) fail('token-collision', `${dir}/${f} declares --${t}, which is a design token`);
    }
  }
}

let browser = await chromium.launch();

/* The run takes minutes and the browser can die under memory pressure. A crash
   used to abort everything with no report at all, losing the whole run; now a
   dead browser is relaunched and only the offending component is retried. */
const withPage = async (opts, fn, label) => {
  for (let attempt = 0; attempt < 2; attempt++) {
    let p;
    try {
      if (!browser.isConnected()) browser = await chromium.launch();
      p = await browser.newPage(opts);
      const out = await fn(p);
      await p.close();
      return out;
    } catch (err) {
      try { if (p) await p.close(); } catch {}
      if (attempt === 1) { fail('crashed', `${label}: ${String(err).split('\n')[0]}`); return null; }
      if (!browser.isConnected()) { try { await browser.close(); } catch {} browser = await chromium.launch(); }
    }
  }
  return null;
};

/* ---------- 2. nothing may overflow its frame ---------- */
for (const c of allComponents()) {
  const r = await withPage({ viewport: { width: 520, height: 347 } }, async (p) => {
  await p.goto(`${BASE}/preview/${c.slug}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(1200);
  return await p.evaluate(() => {
    const box = document.getElementById('fit');
    const b = box.getBoundingClientRect();
    const clipped = [...document.querySelectorAll('#fit-inner *')].filter((el) => {
      const r = el.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return false;
      return r.right > innerWidth + 2 || r.bottom > innerHeight + 2 || r.left < -2 || r.top < -2;
    }).length;
    return {
      out: b.right > innerWidth + 2 || b.bottom > innerHeight + 2 || b.left < -2 || b.top < -2,
      scale: parseFloat(getComputedStyle(box).scale) || 1,
      clipped,
      empty: box.getBoundingClientRect().height < 12
    };
  });
  }, `preview/${c.slug}`);
  if (!r) continue;
  if (r.out) fail('overflow', `${c.slug} escapes its frame`);
  if (r.scale < 0.45) fail('scale', `${c.slug} shrunk to ${r.scale.toFixed(2)} — something is far too large`);
  if (r.empty) fail('empty', `${c.slug} renders nothing at rest`);
}

/* ---------- 3. no horizontal overflow at any width ---------- */
for (const w of [320, 390, 768, 1440]) {
  const r = await withPage({ viewport: { width: w, height: 800 }, isMobile: w < 600 }, async (p) => {
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(2500);
  return await p.evaluate(() => ({
    win: innerWidth, doc: document.documentElement.scrollWidth,
    wide: [...document.querySelectorAll('body *')]
      .filter((el) => el.getBoundingClientRect().width > innerWidth + 1)
      .slice(0, 3).map((el) => el.tagName.toLowerCase() + '.' + String(el.className).split(' ')[0])
  }));
  }, `home @ ${w}px`);
  if (!r) continue;
  if (r.win !== w || r.doc > w + 1) fail('responsive', `${w}px: document is ${r.doc}px wide via ${r.wide.join(', ') || 'unknown'}`);
}

/* ---------- 4. text must not be clipped by its own box ---------- */
{
  const clipped = await withPage({ viewport: { width: 1440, height: 900 } }, async (p) => {
  await p.goto(BASE, { waitUntil: 'networkidle' });
  await p.waitForTimeout(4000);
  return await p.evaluate(() =>
    [...document.querySelectorAll('h1, h2, h3, p, a, button, span, li')]
      .filter((el) => {
        if (!el.textContent.trim()) return false;
        const s = getComputedStyle(el);
        if (s.overflow === 'visible' || s.display === 'none') return false;
        if (el.closest('[data-wb-pane], pre, iframe, .cell__view')) return false;
        return el.scrollHeight > el.clientHeight + 3 || el.scrollWidth > el.clientWidth + 3;
      })
      .slice(0, 4)
      .map((el) => el.tagName.toLowerCase() + ': ' + el.textContent.trim().slice(0, 34)));
  }, 'clipped text');
  for (const c of clipped || []) fail('clipped-text', c);
}

await browser.close();

if (fails.length) {
  console.log('VISUAL QA FAILED\n' + fails.map((f) => '  ' + f).join('\n'));
  process.exit(1);
}
console.log(`visual QA clean — ${allComponents().length} components, 4 widths, no overflow, no clipping, no token collisions`);
