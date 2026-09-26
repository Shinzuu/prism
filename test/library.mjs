import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const r = []; const ck = (n, p, d='') => { r.push(p); console.log(`${p?'PASS':'FAIL'}  ${n}${d?'  — '+d:''}`); };

const b = await chromium.launch();
const pg = await b.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = []; pg.on('pageerror', e => errs.push(e.message));
await pg.goto(BASE, { waitUntil: 'networkidle' });
await pg.waitForTimeout(4600);

const n = await pg.locator('.cell').count();
ck('library: 30 entries', n === 30, `${n}`);
const builtN = await pg.locator('.cell__view iframe').count();
const soonN = await pg.locator('.cell--soon').count();
ck('library: built + scheduled = 30', builtN + soonN === 30, `${builtN} built, ${soonN} scheduled`);
ck('library: every built entry has a preview', builtN > 0 && builtN === n - soonN);

const cols = await pg.evaluate(() => getComputedStyle(document.getElementById('grid')).gridTemplateColumns.split(' ').length);
ck('library: two columns', cols === 2, `${cols} columns`);

await pg.fill('#q', 'table');
await pg.waitForTimeout(200);
let shown = await pg.locator('.cell:not([hidden])').count();
ck('search: narrows results', shown > 0 && shown < 30, `${shown} shown for "table"`);
await pg.fill('#q', 'zzzz'); await pg.waitForTimeout(200);
ck('search: empty state', await pg.locator('#empty').isVisible());
await pg.fill('#q', ''); await pg.waitForTimeout(200);

await pg.locator('.chipf[data-type="chart"]').click();
await pg.waitForTimeout(200);
shown = await pg.locator('.cell:not([hidden])').count();
const allChart = await pg.evaluate(() => [...document.querySelectorAll('.cell:not([hidden])')].every(c => c.dataset.type === 'chart'));
ck('filter: type chip filters', shown === 3 && allChart, `${shown} chart entries`);
await pg.locator('.chipf[data-type="all"]').click(); await pg.waitForTimeout(200);
ck('filter: reset to all', await pg.locator('.cell:not([hidden])').count() === 30);

await pg.keyboard.press('/');
ck('search: slash focuses', await pg.evaluate(() => document.activeElement?.id === 'q'));

const hero = await pg.evaluate(() => {
  const parts = [...document.querySelectorAll('.craft .ln')];
  const notes = [...document.querySelectorAll('.note')];
  const annotated = notes.filter((nt) => {
    const t = nt.querySelector('.note__t');
    const lead = nt.querySelector('.note__lead');
    const dash = getComputedStyle(lead).strokeDasharray;
    const drawn = dash === 'none' || (parseFloat(dash) || 0) >= (lead.getTotalLength() - 2);
    return +getComputedStyle(t).opacity > .9 && drawn;
  }).length;
  const stbd = notes.length, port = annotated;
  const h1 = [...document.querySelectorAll('h1 i')].map(i => getComputedStyle(i).translate);
  return { parts: parts.length,
           drawn: parts.filter(p => parseFloat(getComputedStyle(p).strokeDashoffset) < 1).length,
           filled: parts.filter(p => parseFloat(getComputedStyle(p).fillOpacity) > .5).length,
           stbd, port, h1 };
});
ck('hero: airframe parts drawn', hero.parts >= 18 && hero.drawn === hero.parts, `${hero.drawn}/${hero.parts}`);
ck('hero: surfaces filled', hero.filled >= 10, `${hero.filled} filled`);
ck('hero: every subsystem annotated', hero.stbd === 5 && hero.port === 5, `${hero.port}/${hero.stbd} callouts drawn`);
ck('hero: headline lines settled', hero.h1.every(t => /^(none|0px 0%?|0px 0px)$/.test(t)), JSON.stringify(hero.h1));
ck('no runtime errors', errs.length === 0, errs.slice(0,2).join(' | '));

await pg.screenshot({ path: 'test/library.png', fullPage: false });
await b.close();
const bad = r.filter(x => !x).length;
console.log(`\n${r.length - bad}/${r.length} passed`);
process.exit(bad ? 1 : 0);
