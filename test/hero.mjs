/* The hero is a WebGL island over an SVG fallback, and every way it can fail
   is silent: a colour that three cannot parse leaves white lines on a white
   page, a scoped style that never reaches a React node leaves the canvas
   sized to the document, and a missing island leaves the SVG showing with
   nobody the wiser. Each of those shipped once during the build. */
import { chromium } from 'playwright';
import { SPAN_UNSWEPT, SPAN_SWEPT, SWEEP_MIN, SWEEP_MAX, spanAt } from '../src/components/hero/spec.ts';

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const bad = [];
const ok = (name, pass, detail = '') => {
  if (!pass) bad.push(`${name}${detail ? ` — ${detail}` : ''}`);
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? `  — ${detail}` : ''}`);
};

/* The geometry has to satisfy both published spans, not one of them. */
ok('spec: span at 20° matches the sheet', Math.abs(spanAt(SWEEP_MIN) - SPAN_UNSWEPT) < 0.005, `${spanAt(SWEEP_MIN).toFixed(2)} m`);
ok('spec: span at 68° matches the sheet', Math.abs(spanAt(SWEEP_MAX) - SPAN_SWEPT) < 0.005, `${spanAt(SWEEP_MAX).toFixed(2)} m`);

const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });

/* --- the island runs ------------------------------------------------------ */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(SITE, { waitUntil: 'load' });
  await page.waitForTimeout(9000);

  const r = await page.evaluate(() => {
    const af = document.querySelector('.af');
    const c = document.querySelector('.af__canvas');
    const plate = document.querySelector('.hero__plate');
    const svg = plate?.querySelector(':scope > svg');
    return {
      live: af?.classList.contains('af--live') ?? false,
      canvas: c ? { w: c.width, h: c.height, box: c.getBoundingClientRect().width | 0 } : null,
      plate: plate ? plate.getBoundingClientRect().width | 0 : 0,
      notes: [...document.querySelectorAll('.af__note')].map((n) => n.textContent.trim()),
      span: document.querySelector('.af__span')?.textContent?.trim() ?? '',
      svgPresent: !!svg,
      svgHidden: svg ? Number(getComputedStyle(svg).opacity) < 0.05 : false,
    };
  });

  ok('island mounts and goes live', r.live);
  ok('canvas exists', !!r.canvas);
  /* The canvas once sized itself to the whole document because Astro's scoped
     CSS never reaches a React-rendered node. */
  ok('canvas is sized to the plate, not the page',
    !!r.canvas && Math.abs(r.canvas.box - r.plate) < 8 && r.canvas.h < 2000,
    r.canvas ? `${r.canvas.w}x${r.canvas.h} in a ${r.plate}px plate` : '');
  ok('all five callouts are placed', r.notes.length === 5, r.notes.length ? r.notes[0] : '');
  ok('the span readout quotes a real number', /\d+\.\d\d m/.test(r.span), r.span);
  ok('the SVG sheet is still in the document as the fallback', r.svgPresent);
  ok('the SVG is hidden once the island is live', r.svgHidden);
  ok('no runtime errors', errs.length === 0, errs[0] ?? '');

  /* Ink colour comes from the palette, and the way it fails is silent: three's
     Color.set() understands hex, rgb() and hsl() and nothing else, so an
     oklch() token leaves every material white and the drawing vanishes into
     the page.

     Three earlier versions of this check had no teeth, and each was worth
     recording. readPixels always read back empty, because without
     preserveDrawingBuffer the buffer is cleared once the frame is composited.
     Comparing PNG sizes failed because the drafting grid dominates the file.
     Screenshotting the canvas failed for the same reason — the canvas has an
     alpha channel, so the shot is mostly the grid showing through it, and
     white ink scored within seven pixels of black.

     So ask the component what the palette resolved to, and check it is
     actually ink against the page. */
  const ink = await page.evaluate(() => {
    const af = document.querySelector('.af');
    return { ink: af?.getAttribute('data-ink') ?? '', ground: af?.getAttribute('data-ground') ?? '' };
  });
  const [ir, ig, ib] = ink.ink.split(',').map(Number);
  const [gr, gg, gb] = ink.ground.split(',').map(Number);
  const sep = Math.abs(ir - gr) + Math.abs(ig - gg) + Math.abs(ib - gb);
  ok('the ink resolves to a colour that reads against the page',
    ink.ink !== '' && sep > 200, `ink ${ink.ink || 'unset'} on ground ${ink.ground || 'unset'} (separation ${sep || 0})`);

  await ctx.close();
}

/* --- reduced motion shows the finished drawing ---------------------------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.goto(SITE, { waitUntil: 'load' });
  await page.waitForTimeout(6000);
  const r = await page.evaluate(() => ({
    live: document.querySelector('.af')?.classList.contains('af--live') ?? false,
    notes: document.querySelectorAll('.af__note').length,
  }));
  ok('reduced motion still draws the sheet', r.live && r.notes === 5, `${r.notes} callouts`);
  await ctx.close();
}

await browser.close();

if (bad.length) {
  console.error(`\nhero: ${bad.length} failures\n  ` + bad.join('\n  '));
  process.exit(1);
}
console.log('\nhero clean');
