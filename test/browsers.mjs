/* Cross-browser sweep. Everything until now was verified in Chromium only,
   and this library leans on recent CSS — @property, view and scroll timelines,
   CSS.highlights, corner-shape, relative oklch(), invoker commands. Each of
   those has an @supports fallback, and a fallback nobody has run is a guess.

   Two questions per component, per engine:
     does it render anything at all, and does it throw. */
import { chromium, firefox, webkit } from 'playwright';
import { allComponents } from '../src/lib/registry.js';

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const ONLY = process.env.ENGINES?.split(',');
const ENGINES = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]
  .filter(([n]) => !ONLY || ONLY.includes(n));

const all = allComponents();
const report = {};

for (const [name, engine] of ENGINES) {
  const browser = await engine.launch();
  const page = await browser.newPage({ viewport: { width: 560, height: 420 } });
  const blank = [], threw = [];

  for (const c of all) {
    const errs = [];
    const onErr = (e) => errs.push(String(e.message ?? e).slice(0, 120));
    page.on('pageerror', onErr);
    try {
      await page.goto(`${SITE}/preview/${c.slug}`, { waitUntil: 'load', timeout: 20000 });
      await page.waitForTimeout(900);
      const len = await page.evaluate(() => document.querySelector('#fit-inner')?.innerHTML.length || 0);
      if (len < 80) blank.push(c.slug);
    } catch (e) {
      threw.push(`${c.slug}: ${String(e.message).split('\n')[0].slice(0, 90)}`);
    }
    page.off('pageerror', onErr);
    if (errs.length) threw.push(`${c.slug}: ${errs[0]}`);
  }

  // Which of the load-bearing features this engine actually has.
  const feats = await page.evaluate(() => ({
    property: typeof CSS !== 'undefined' && 'registerProperty' in CSS,
    viewTimeline: CSS.supports('animation-timeline: view()'),
    scrollTimeline: CSS.supports('scroll-timeline: --x block'),
    highlights: typeof CSS !== 'undefined' && 'highlights' in CSS,
    relativeColor: CSS.supports('color', 'oklch(from red l c h)'),
    cornerShape: CSS.supports('corner-shape', 'scoop'),
    invokers: 'commandForElement' in HTMLButtonElement.prototype,
    viewTransitions: typeof document.startViewTransition === 'function',
    fieldSizing: CSS.supports('field-sizing', 'content'),
  }));

  await browser.close();
  report[name] = { blank, threw, feats };
  console.log(`${name}: ${all.length - blank.length}/${all.length} rendered, ${threw.length} threw`);
}

console.log('\n' + JSON.stringify(report, null, 1));
const broken = Object.values(report).some((r) => r.blank.length || r.threw.length);
process.exit(broken ? 1 : 0);
