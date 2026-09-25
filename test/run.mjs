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
check('palette: trigger visible', await page.locator('.cp__trigger').isVisible());
await page.keyboard.press('Control+k');
await page.waitForTimeout(250);
const panelOpen = await page.locator('.cp__panel').isVisible();
check('palette: Ctrl+K opens', panelOpen);
if (panelOpen) {
  check('palette: focus in input', await page.evaluate(() => document.activeElement?.id === 'cp-input'));
  const n0 = await page.locator('.cp__opt').count();
  await page.keyboard.type('gtd');
  await page.waitForTimeout(150);
  const n1 = await page.locator('.cp__opt').count();
  const txt = await page.locator('.cp__opt').first().innerText().catch(() => '');
  check('palette: fuzzy filter narrows', n1 > 0 && n1 < n0, `${n0} -> ${n1}, first="${txt.trim()}"`);
  check('palette: subsequence matched', /go to definition/i.test(txt));
  const a0 = await page.getAttribute('#cp-input', 'aria-activedescendant');
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(120);
  const a1 = await page.getAttribute('#cp-input', 'aria-activedescendant');
  check('palette: arrow moves activedescendant', a0 !== a1 || n1 === 1, `${a0} -> ${a1}`);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);
  check('palette: Escape closes', !(await page.locator('.cp__panel').isVisible()));
}

// ---------- filmstrip ----------
await page.goto(`${BASE}/preview/scroll-filmstrip`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);
const fsInfo = await page.evaluate(() => {
  const el = document.querySelector('.fs');
  const rail = document.querySelector('.fs__rail');
  if (!el || !rail) return null;
  return {
    supported: CSS.supports('animation-timeline', 'scroll()'),
    scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
    canScroll: el.scrollHeight > el.clientHeight + 4,
    railBefore: getComputedStyle(rail).transform,
    panels: document.querySelectorAll('.fs__panel').length
  };
});
check('filmstrip: mounted', !!fsInfo, JSON.stringify(fsInfo));
if (fsInfo) {
  check('filmstrip: 4 panels', fsInfo.panels === 4);
  check('filmstrip: container scrollable', fsInfo.canScroll, `${fsInfo.scrollHeight} vs ${fsInfo.clientHeight}`);
  await page.evaluate(() => { document.querySelector('.fs').scrollTop = 99999; });
  await page.waitForTimeout(500);
  const after = await page.evaluate(() => getComputedStyle(document.querySelector('.fs__rail')).transform);
  check('filmstrip: rail pans on scroll', after !== fsInfo.railBefore, `${fsInfo.railBefore} -> ${after}`);
  const lastVisible = await page.evaluate(() => {
    const p = document.querySelectorAll('.fs__panel');
    const last = p[p.length - 1].getBoundingClientRect();
    const stage = document.querySelector('.fs__stage').getBoundingClientRect();
    return last.left < stage.right && last.right > stage.left;
  });
  check('filmstrip: last panel reachable', lastVisible);
}

// ---------- spotlight card ----------
await page.goto(`${BASE}/preview/spotlight-card`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const card = page.locator('.sc__card').first();
check('spotlight: card visible', await card.isVisible());
const box = await card.boundingBox();
await page.mouse.move(box.x + box.width * 0.3, box.y + box.height * 0.3);
await page.waitForTimeout(250);
const sc = await page.evaluate(() => {
  const c = document.querySelector('.sc__card');
  return { lit: c.style.getPropertyValue('--lit'), mx: c.style.getPropertyValue('--mx'), tf: c.style.transform };
});
check('spotlight: lights on pointer', sc.lit === '1', JSON.stringify(sc));
check('spotlight: tilts on pointer', /rotate/.test(sc.tf), sc.tf || '(none)');
await page.mouse.move(5, 5);
await page.waitForTimeout(250);
check('spotlight: rests on leave', (await page.evaluate(() => document.querySelector('.sc__card').style.getPropertyValue('--lit'))) === '0');

// ---------- code input ----------
await page.goto(`${BASE}/preview/code-input`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
await page.locator('.ci__slot').first().focus();
await page.keyboard.type('123');
await page.waitForTimeout(150);
const typed = await page.evaluate(() => [...document.querySelectorAll('.ci__slot')].map(s => s.value).join(''));
check('code: typing advances slots', typed === '123', `got "${typed}"`);
await page.keyboard.press('Backspace');
await page.keyboard.press('Backspace');
await page.waitForTimeout(150);
const afterBk = await page.evaluate(() => [...document.querySelectorAll('.ci__slot')].map(s => s.value).join(''));
check('code: backspace walks back', afterBk.length < 3, `got "${afterBk}"`);
// autofill: whole code into one slot
await page.evaluate(() => {
  const s = document.querySelectorAll('.ci__slot');
  s.forEach(x => x.value = '');
  s[0].value = '482913';
  s[0].dispatchEvent(new Event('input', { bubbles: true }));
});
await page.waitForTimeout(250);
const filled = await page.evaluate(() => [...document.querySelectorAll('.ci__slot')].map(s => s.value).join(''));
check('code: autofill distributes', filled === '482913', `got "${filled}"`);
const state = await page.evaluate(() => document.querySelector('.ci').dataset.state);
check('code: reports success state', state === 'done', `state="${state}"`);

// ---------- segmented nav ----------
await page.goto(`${BASE}/preview/segment-nav`, { waitUntil: 'networkidle' });
await page.waitForTimeout(500);
const nav0 = await page.evaluate(() => {
  const b = document.querySelector('.sn__indicator');
  return { x: b.style.getPropertyValue('--x'), w: b.style.getPropertyValue('--w'), ready: b.style.getPropertyValue('--ready') };
});
check('nav: indicator placed on load', nav0.ready === '1' && parseFloat(nav0.w) > 0, JSON.stringify(nav0));
await page.locator('.sn__item').nth(2).click();
await page.waitForTimeout(500);
const nav1 = await page.evaluate(() => document.querySelector('.sn__indicator').style.getPropertyValue('--x'));
check('nav: indicator travels on click', nav1 !== nav0.x, `${nav0.x} -> ${nav1}`);
await page.locator('.sn__item').nth(2).focus();
await page.keyboard.press('ArrowRight');
await page.waitForTimeout(400);
const cur = await page.evaluate(() => [...document.querySelectorAll('.sn__item')].findIndex(i => i.getAttribute('aria-current') === 'page'));
check('nav: arrow key selects', cur === 3, `current index ${cur}`);

check('no runtime errors on any preview', errors.length === 0, errors.slice(0, 3).join(' | '));

await browser.close();
const failed = results.filter(r => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
