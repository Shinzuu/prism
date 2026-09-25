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
ck('library: 5 built with previews', await pg.locator('.cell__view iframe').count() === 5);
ck('library: 25 scheduled', await pg.locator('.cell--soon').count() === 25);

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
  // sweep uses the independent rotate property, which never appears in `transform`
  const stbd = getComputedStyle(document.querySelector('.wing--stbd')).rotate;
  const port = getComputedStyle(document.querySelector('.wing--port')).rotate;
  const h1 = [...document.querySelectorAll('h1 i')].map(i => getComputedStyle(i).translate);
  return { parts: parts.length,
           drawn: parts.filter(p => parseFloat(getComputedStyle(p).strokeDashoffset) < 1).length,
           filled: parts.filter(p => parseFloat(getComputedStyle(p).fillOpacity) > .5).length,
           stbd, port, h1 };
});
ck('hero: airframe parts drawn', hero.parts >= 18 && hero.drawn === hero.parts, `${hero.drawn}/${hero.parts}`);
ck('hero: surfaces filled', hero.filled >= 10, `${hero.filled} filled`);
const deg = (v) => parseFloat(v) || 0;
ck('hero: wings swept aft', Math.abs(deg(hero.stbd)) > 15 && Math.sign(deg(hero.stbd)) !== Math.sign(deg(hero.port)),
   `stbd=${hero.stbd} port=${hero.port}`);
ck('hero: headline lines settled', hero.h1.every(t => /^(none|0px 0%?|0px 0px)$/.test(t)), JSON.stringify(hero.h1));
ck('no runtime errors', errs.length === 0, errs.slice(0,2).join(' | '));

await pg.screenshot({ path: 'test/library.png', fullPage: false });
await b.close();
const bad = r.filter(x => !x).length;
console.log(`\n${r.length - bad}/${r.length} passed`);
process.exit(bad ? 1 : 0);
