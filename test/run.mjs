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

// ---------- freshness card ----------
await page.goto(`${BASE}/preview/freshness-card`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const fcCard = page.locator('article[data-freshness]');
check('freshness: starts fresh with an age', (await fcCard.getAttribute('data-freshness')) === 'fresh' && /ago|just now/.test(await fcCard.textContent()));
const fcBtn = page.getByRole('button', { name: /Refresh/ });
const fcBefore = await page.locator('.fc-value').textContent();
await fcBtn.click();
await page.waitForTimeout(150);
check('freshness: busy while refreshing, value kept', (await fcCard.getAttribute('aria-busy')) === 'true' && (await page.locator('.fc-value').textContent()) === fcBefore);
await page.waitForTimeout(1100);
check('freshness: refresh lands', /just now/.test(await fcCard.textContent()) && (await fcCard.getAttribute('aria-busy')) === 'false');

// ---------- mention field ----------
await page.goto(`${BASE}/preview/mention-field`, { waitUntil: 'networkidle' });
await page.waitForTimeout(300);
const mfTa = page.locator('textarea[role=combobox]');
await mfTa.click();
await page.keyboard.press('Control+End');
await page.keyboard.type(' @an');
check('mention: @ opens a filtered list', (await page.locator('[role=option]').count()) === 2 && (await mfTa.getAttribute('aria-expanded')) === 'true');
await page.keyboard.press('Enter');
check('mention: enter inserts the name', (await mfTa.inputValue()).endsWith('@Ana Lima '));
await page.keyboard.press('Backspace');
await page.keyboard.press('Backspace');
check('mention: backspace removes it whole', (await mfTa.inputValue()).endsWith('Friday? '));
// A real key press, not a synthetic select event: the synthetic one passed while ArrowLeft was trapped.
await page.evaluate(() => { const t = document.querySelector('textarea'); t.setSelectionRange(16, 16); });
await page.keyboard.press('ArrowLeft');
check('mention: ArrowLeft crosses a mention whole', (await page.evaluate(() => document.querySelector('textarea').selectionStart)) === 7);

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
