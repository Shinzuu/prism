import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const r = []; const ck = (n,p,d='') => { r.push(p); console.log(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`); };
const b = await chromium.launch();

const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await pg.goto(BASE, { waitUntil: 'commit' });

// DrawSVG drives stroke-dasharray, so dashoffset alone says nothing about
// how much of a path is painted. Compare the dash length to the path length.
const painted = () => pg.evaluate(() => {
  const parts = [...document.querySelectorAll('.craft .ln')];
  const done = parts.filter((p) => {
    const raw = getComputedStyle(p).strokeDasharray;
    if (raw === 'none' || raw === '') return true;
    const len = p.getTotalLength ? p.getTotalLength() : 0;
    return len === 0 || (parseFloat(raw) || 0) >= len - 2;
  });
  return { total: parts.length, drawn: done.length };
});
/* Sampling at one fixed instant is a coin flip: how far the timeline has run
   by then depends on how fast the page loaded, so a warm cache turns a real
   pass into a failure. Sample repeatedly instead and assert the shape of the
   sequence — at some point part of the airframe is drawn and part is not. */
/* Before GSAP runs, the paths carry no dasharray at all, which the painted()
   test reads as fully drawn. Sampling from page load therefore catches the
   static SVG and calls the animation finished before it has started. Wait for
   the timeline to arm itself first. */
await pg.waitForFunction(() => {
  const parts = [...document.querySelectorAll('.craft .ln')];
  if (!parts.length) return false;
  return parts.some((p) => {
    const raw = getComputedStyle(p).strokeDasharray;
    return raw && raw !== 'none';
  });
}, null, { timeout: 15000 });

const samples = [];
for (let i = 0; i < 40; i++) {
  const s = await painted();
  samples.push(s);
  if (s.total && s.drawn >= s.total) break;
  await pg.waitForTimeout(60);
}
const partial = samples.find((s) => s.total > 0 && s.drawn > 0 && s.drawn < s.total);
const grew = samples.length > 1 && samples.at(-1).drawn > samples[0].drawn;
ck(
  'hero: draws progressively',
  Boolean(partial) || grew,
  partial
    ? `${partial.drawn}/${partial.total} mid-timeline`
    : `${samples[0]?.drawn ?? 0} -> ${samples.at(-1)?.drawn ?? 0} of ${samples.at(-1)?.total ?? 0}`,
);

/* Wait for the timeline to settle rather than for a fixed duration: the
   4200ms this used to sleep for was chosen against one machine's load time. */
await pg
  .waitForFunction(() => {
    const parts = [...document.querySelectorAll('.craft .ln')];
    if (!parts.length) return false;
    const drawn = parts.filter((p) => {
      const raw = getComputedStyle(p).strokeDasharray;
      if (raw === 'none' || raw === '') return true;
      const len = p.getTotalLength ? p.getTotalLength() : 0;
      return len === 0 || (parseFloat(raw) || 0) >= len - 2;
    }).length;
    const notes = [...document.querySelectorAll('.note .note__t')];
    return drawn === parts.length && notes.length > 0 && notes.every((t) => +getComputedStyle(t).opacity > 0.9);
  }, null, { timeout: 20000 })
  .catch(() => {}); /* let the assertions below report what actually settled */

const done = await pg.evaluate(() => {
  const parts = [...document.querySelectorAll('.craft .ln')];
  const paintedN = parts.filter((p) => {
    const raw = getComputedStyle(p).strokeDasharray;
    if (raw === 'none' || raw === '') return true;
    const len = p.getTotalLength ? p.getTotalLength() : 0;
    return len === 0 || (parseFloat(raw) || 0) >= len - 2;
  }).length;
  return {
    drawn: paintedN,
    total: parts.length,
    filled: parts.filter(p => parseFloat(getComputedStyle(p).fillOpacity) > .5).length,
    notes: document.querySelectorAll('.note').length,
    notesDone: [...document.querySelectorAll('.note .note__t')].filter(t => +getComputedStyle(t).opacity > .9).length,
    gsap: typeof window.gsap,
    lenis: !!document.documentElement.className.match(/lenis/)
  };
});
ck('hero: fully drawn', done.drawn === done.total, `${done.drawn}/${done.total}`);
ck('hero: surfaces filled', done.filled >= 10, `${done.filled}`);
ck('hero: callouts annotate by GSAP', done.notes === 5 && done.notesDone === 5, `${done.notesDone}/${done.notes}`);
ck('no smooth-scroll library loaded', !done.lenis, 'native scrolling');

/* The Flip type-filter assertions lived here and were removed 2026-09-29:
   the sectioned redesign replaced the .chipf chips and the flat .cell grid
   with a per-type rail and a search field, so they were asserting a UI that
   no longer exists. Search narrowing is covered by test/library.mjs. */

// component page reveals
await pg.goto(`${BASE}/components/command-palette`, { waitUntil: 'networkidle' });
await pg.waitForTimeout(1200);
await pg.evaluate(() => window.scrollTo(0, 1400));
await pg.waitForTimeout(1400);
const revealed = await pg.evaluate(() => {
  const q = document.querySelector('.quote');
  return q ? +getComputedStyle(q).opacity : -1;
});
ck('doc: scroll reveals settle visible', revealed > .9, `opacity ${revealed}`);

// reduced motion must skip everything but land in final state
const rm = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
await rm.goto(BASE, { waitUntil: 'networkidle' });
await rm.waitForTimeout(900);
const rmState = await rm.evaluate(() => {
  const parts = [...document.querySelectorAll('.craft .ln')];
  return { drawn: parts.filter((p) => {
             const raw = getComputedStyle(p).strokeDasharray;
             if (raw === 'none' || raw === '') return true;   // no dash = solid stroke
             const len = p.getTotalLength ? p.getTotalLength() : 0;
             return len === 0 || (parseFloat(raw) || 0) >= len - 2;
           }).length,
           total: parts.length,
           h1: [...document.querySelectorAll('h1 i')].map(i => Math.round(i.getBoundingClientRect().top)),
           lenis: !!document.documentElement.className.match(/lenis/) };
});
ck('reduced motion: airframe complete immediately', rmState.drawn === rmState.total, `${rmState.drawn}/${rmState.total}`);
ck('reduced motion: headline visible', rmState.h1.every(t => t > 0 && t < 900), JSON.stringify(rmState.h1));
ck('reduced motion: no smooth scroll', !rmState.lenis);
ck('no runtime errors', errs.length === 0, errs.slice(0,2).join(' | '));

await b.close();
const bad = r.filter(x => !x).length;
console.log(`\n${r.length - bad}/${r.length} passed`);
process.exit(bad ? 1 : 0);
