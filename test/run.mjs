import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const results = [];
const check = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();

const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

// ---------- command palette ----------
await page.goto(`${BASE}/preview/command-palette`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
check('palette: trigger visible', await page.getByRole('button', { name: 'Search commands' }).isVisible());
await page.keyboard.press('Control+k');
await page.waitForTimeout(250);
const panelOpen = await page.locator('[role=dialog]').isVisible();
check('palette: Ctrl+K opens', panelOpen);
if (panelOpen) {
  check('palette: focus in input', await page.evaluate(() => document.activeElement?.id === 'cp-input'));
  const n0 = await page.locator('[role=option]').count();
  await page.keyboard.type('gtd');
  await page.waitForTimeout(150);
  const n1 = await page.locator('[role=option]').count();
  const txt = await page.locator('[role=option]').first().innerText().catch(() => '');
  check('palette: fuzzy filter narrows', n1 > 0 && n1 < n0, `${n0} -> ${n1}, first="${txt.trim()}"`);
  check('palette: subsequence matched', /go to definition/i.test(txt));
  const a0 = await page.getAttribute('#cp-input', 'aria-activedescendant');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const a1 = await page.getAttribute('#cp-input', 'aria-activedescendant');
  check('palette: arrow moves activedescendant', a0 !== a1 || n1 === 1, `${a0} -> ${a1}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('palette: Escape closes', !(await page.locator('[role=dialog]').isVisible()));
}

// ---------- filmstrip ----------
await page.goto(`${BASE}/preview/scroll-filmstrip`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const fsInfo = await page.evaluate(() => {
  const el = document.querySelector('.fs');
  const rail = document.querySelector('.fs-rail');
  if (!el || !rail) return null;
  return {
    supported: CSS.supports('animation-timeline', 'scroll()'),
    scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
    canScroll: el.scrollHeight > el.clientHeight + 4,
    railBefore: getComputedStyle(rail).transform,
    panels: document.querySelectorAll('.fs-rail article').length
  };
});
check('filmstrip: mounted', !!fsInfo, JSON.stringify(fsInfo));
if (fsInfo) {
  check('filmstrip: 4 panels', fsInfo.panels === 4);
  check('filmstrip: container scrollable', fsInfo.canScroll, `${fsInfo.scrollHeight} vs ${fsInfo.clientHeight}`);
  await page.evaluate(() => { document.querySelector('.fs').scrollTop = 99999; });
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => getComputedStyle(document.querySelector('.fs-rail')).transform);
  check('filmstrip: rail pans on scroll', after !== fsInfo.railBefore, `${fsInfo.railBefore} -> ${after}`);
  const lastVisible = await page.evaluate(() => {
    const p = document.querySelectorAll('.fs-rail article');
    const last = p[p.length - 1].getBoundingClientRect();
    const stage = document.querySelector('.fs-stage').getBoundingClientRect();
    return last.left < stage.right && last.right > stage.left;
  });
  check('filmstrip: last panel reachable', lastVisible);
}

// ---------- spotlight card ----------
await page.goto(`${BASE}/preview/spotlight-card`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const card = page.locator('.sc-card').first();
check('spotlight: card visible', await card.isVisible());
const box = await card.boundingBox();
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
await page.waitForTimeout(250);
const sc = await page.evaluate(() => {
  const c = document.querySelector('.sc-card');
  return { lit: c.style.getPropertyValue('--lit'), mx: c.style.getPropertyValue('--mx'), tf: c.style.transform };
});
check('spotlight: lights on pointer', sc.lit === '1', JSON.stringify(sc));
check('spotlight: tilts on pointer', /rotate/.test(sc.tf), sc.tf || '(none)');
await page.mouse.move(5, 5);
await page.waitForTimeout(250);
check('spotlight: rests on leave', (await page.evaluate(() => getComputedStyle(document.querySelector('.sc-card')).getPropertyValue('--lit').trim())) === '0');

// ---------- code input ----------
await page.goto(`${BASE}/preview/code-input`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('input[inputmode=numeric]').first().focus();
await page.keyboard.type('123');
await page.waitForTimeout(150);
const typed = await page.evaluate(() => [...document.querySelectorAll('input[inputmode=numeric]')].map(s => s.value).join(''));
check('code: typing advances slots', typed === '123', `got "${typed}"`);
await page.keyboard.press('Backspace');
await page.keyboard.press('Backspace');
await page.waitForTimeout(150);
const afterBk = await page.evaluate(() => [...document.querySelectorAll('input[inputmode=numeric]')].map(s => s.value).join(''));
check('code: backspace walks back', afterBk.length < 3, `got "${afterBk}"`);
// autofill: whole code into one slot
await page.evaluate(() => {
  const s = document.querySelectorAll('input[inputmode=numeric]');
  s.forEach(x => x.value = '');
  /* React tracks the last value it wrote, so assigning .value directly is
     swallowed and onChange never fires — the field would just hold all six
     digits in slot one while the test read them back and looked green. Going
     through the native setter is what actually exercises the component. */
  const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
  set.call(s[0], '482913');
  s[0].dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const filled = await page.evaluate(() => [...document.querySelectorAll('input[inputmode=numeric]')].map(s => s.value).join(''));
check('code: autofill distributes', filled === '482913', `got "${filled}"`);
// The React version states the outcome in the live region rather than on a
// data attribute, which is the part a user actually receives.
const state = await page.evaluate(() => document.querySelector('[role=status]')?.textContent ?? '');
check('code: reports success state', /accepted/i.test(state), `status="${state}"`);

// ---------- segmented nav ----------
await page.goto(`${BASE}/preview/segment-nav`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const nav0 = await page.evaluate(() => {
  const b = document.querySelector('.sn-indicator');
  return { x: b.style.translate, w: b.style.width, ready: b.style.opacity };
});
check('nav: indicator placed on load', nav0.ready === '1' && parseFloat(nav0.w) > 0, JSON.stringify(nav0));
await page.locator('nav button').nth(2).click();
await page.waitForTimeout(500);
const nav1 = await page.evaluate(() => document.querySelector('.sn-indicator').style.translate);
check('nav: indicator travels on click', nav1 !== nav0.x, `${nav0.x} -> ${nav1}`);
await page.locator('nav button').nth(2).focus();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
const cur = await page.evaluate(() => [...document.querySelectorAll('nav button')].findIndex(i => i.getAttribute('aria-current') === 'page'));
check('nav: arrow key selects', cur === 3, `current index ${cur}`);

check('no runtime errors on any preview', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
