/* Does Back actually put you back?

   The library is seventy tiles long. Every one of these checks exists because
   the phone did the wrong thing: Back landed at the top of the grid, tapping a
   preview did nothing at all, and the only previous/next links were past the
   end of a three-thousand-pixel page.

   Phone viewport first, then the same pages at desktop width. */
import { chromium } from 'playwright';

const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const out = [];
const ok = (n, c, extra = '') => out.push(`${c ? 'PASS' : 'FAIL'}  ${n}${extra ? '  ' + extra : ''}`);

const b = await chromium.launch();
const page = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

await page.goto(BASE + '/', { waitUntil: 'load' });
await page.waitForTimeout(600);

// Scroll a long way down, into the grid.
await page.evaluate(() => scrollTo(0, 4200));
await page.waitForTimeout(400);
const before = await page.evaluate(() => Math.round(scrollY));

// Open whichever tile is under the middle of the screen.
const slug = await page.evaluate(() => {
  const tiles = [...document.querySelectorAll('a.tile__in')];
  const hit = tiles.find((t) => {
    const r = t.getBoundingClientRect();
    return r.top > 0 && r.top < innerHeight - 120;
  }) || tiles[0];
  return hit.getAttribute('href');
});
await page.click(`a.tile__in[href="${slug}"]`);
await page.waitForURL('**' + slug);
await page.waitForTimeout(300);

ok('component page opens', page.url().endsWith(slug), slug);
ok('breadcrumb back control present', await page.locator('.pnav__back').count() === 1);
ok('fixed pager visible on phone', await page.locator('.pager').isVisible());
ok('desktop jump nav hidden on phone', !(await page.locator('.jump').isVisible()));
const pagerBox = await page.locator('.pager').boundingBox();
ok('pager sits at the bottom of the screen', pagerBox && pagerBox.y + pagerBox.height >= 843 - 2,
  pagerBox ? `y=${Math.round(pagerBox.y)} h=${Math.round(pagerBox.height)}` : 'no box');
ok('pager targets are >=44px tall', pagerBox && pagerBox.height >= 44, `${Math.round(pagerBox?.height ?? 0)}px`);

// Back.
await page.goBack({ waitUntil: 'load' });
await page.waitForTimeout(900);
const after = await page.evaluate(() => Math.round(scrollY));
ok('back restores the scroll position', Math.abs(after - before) < 120, `was ${before}, is ${after}`);
ok('the tile you opened is marked', await page.locator('.tile--seen').count() === 1);

// Search survives the round trip.
await page.fill('#q', 'table');
await page.waitForTimeout(500);
ok('search writes ?q= into the URL', page.url().includes('q=table'), page.url());
ok('clear button appears', await page.locator('#qx').isVisible());
const shown = await page.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => !t.hidden).length);
await page.evaluate(() => scrollTo(0, 900));
await page.waitForTimeout(300);
const slug2 = await page.evaluate(() => document.querySelector('.tile:not([hidden]) a.tile__in')?.getAttribute('href'));
await page.goto(BASE + slug2, { waitUntil: 'load' });
await page.goBack({ waitUntil: 'load' });
await page.waitForTimeout(900);
const stillFiltered = await page.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => !t.hidden).length);
ok('back keeps the filter', stillFiltered === shown, `${shown} then ${stillFiltered}`);

// Clear.
await page.click('#qx');
await page.waitForTimeout(500);
ok('clear empties the filter and the URL', !page.url().includes('q='), page.url());

// Keyboard paging, desktop viewport.
const d = await b.newPage({ viewport: { width: 1280, height: 900 } });
await d.goto(BASE + slug, { waitUntil: 'load' });
await d.waitForTimeout(300);
ok('pager hidden on desktop', !(await d.locator('.pager').isVisible()));
ok('desktop jump nav shown', await d.locator('.jump').isVisible());
const nextHref = await d.locator('[data-nav-next]').first().getAttribute('href');
await d.keyboard.press('ArrowRight');
await d.waitForTimeout(600);
ok('ArrowRight walks to the next component', nextHref ? d.url().endsWith(nextHref) : true, d.url());

// Active nav marker.
await d.goto(BASE + '/logs', { waitUntil: 'load' });
ok('masthead marks the page you are on',
  (await d.locator('.mast__nav a[aria-current="page"]').textContent()) === 'Logs');

// Back-to-top.
await d.goto(BASE + slug, { waitUntil: 'load' });
await d.evaluate(() => scrollTo(0, 3000));
await d.waitForTimeout(400);
ok('back-to-top appears once you are down the page', await d.locator('.totop').isVisible());
await d.click('.totop');
await d.waitForFunction(() => scrollY < 10, null, { timeout: 4000 }).catch(() => {});
ok('back-to-top returns to the top', (await d.evaluate(() => Math.round(scrollY))) < 10);

await b.close();
console.log(out.join('\n'));
const bad = out.filter((l) => l.startsWith('FAIL'));
console.log(bad.length ? `\n${bad.length} failing` : '\nnavigation checks clean');
process.exit(bad.length ? 1 : 0);
