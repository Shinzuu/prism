import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const r = []; const ck = (n,p,d='') => { r.push(p); console.log(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`); };
const b = await chromium.launch();

const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
pg.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await pg.goto(BASE, { waitUntil: 'networkidle' });

// mid-timeline: the airframe should be partially drawn, not all or nothing
await pg.waitForTimeout(520);
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
const mid = await painted();
ck('hero: draws progressively', mid.drawn > 0 && mid.drawn < mid.total, `${mid.drawn}/${mid.total} at 520ms`);

await pg.waitForTimeout(4200);
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
