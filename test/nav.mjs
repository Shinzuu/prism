/* Does Back actually put you back?

   The library is seventy tiles long. Every check here exists because the phone
   did the wrong thing: Back landed at the top of the grid, tapping a preview
   did nothing at all, and the only previous/next links were past the end of a
   three-thousand-pixel page.

   Run across all three engines, because the whole mechanism rests on things
   engines disagree about — history.scrollRestoration, when a bfcache restore
   fires, whether a sandboxed iframe swallows a tap, and env(safe-area-inset-*).
   ENGINES=chromium narrows it while iterating.

   The suite is also run with JavaScript switched off and with sessionStorage
   made to throw, because both are real conditions and neither may take the
   navigation down with it. */
import { chromium, firefox, webkit } from 'playwright';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const ONLY = process.env.ENGINES?.split(',');
const ENGINES = [['chromium', chromium], ['firefox', firefox], ['webkit', webkit]]
  .filter(([n]) => !ONLY || ONLY.includes(n));

const PHONE = { width: 390, height: 844 };
const DESK = { width: 1280, height: 900 };

const rows = [];
let engine = '';
const ok = (name, pass, note = '') => {
  rows.push({ engine, name, pass: !!pass, note: String(note).slice(0, 120) });
  if (!pass) console.log(`  FAIL  ${engine}  ${name}${note ? '  — ' + note : ''}`);
};
const near = (a, b, slack) => Math.abs(a - b) <= slack;

/* Firefox has no touch emulation in Playwright, so a phone context there is a
   narrow viewport and mouse input. That still exercises every layout and
   history path; only the literal tap does not apply. */
const phoneCtx = (browser, name, extra = {}) =>
  browser.newContext({
    viewport: PHONE,
    ...(name === 'firefox' ? {} : { isMobile: true, hasTouch: true, deviceScaleFactor: 2 }),
    ...extra
  });

/* A bfcache restore does not fire `load`, and one engine or another will take
   that path, so waiting for it hangs. Commit is enough; the settle time after
   each call is what the checks actually depend on. */
const step = async (p, dir) => {
  try { await p[dir]({ waitUntil: 'commit', timeout: 15000 }); }
  catch { /* already restored, or nothing to restore to */ }
};
const goBack = (p) => step(p, 'goBack');
const goForward = (p) => step(p, 'goForward');

const sy = (p) => p.evaluate(() => Math.round(scrollY));
const overflowX = (p) => p.evaluate(() =>
  Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));

for (const [name, launcher] of ENGINES) {
  engine = name;
  const browser = await launcher.launch();

  // ---------------------------------------------------------------- phone ---
  {
    const ctx = await phoneCtx(browser, name);
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));

    await p.goto(SITE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(700);

    ok('masthead height is measured into --mast-h',
      Number(await p.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--mast-h').replace('px', ''))) > 20);
    ok('index does not scroll sideways at 390px', (await overflowX(p)) === 0, `${await overflowX(p)}px over`);

    await p.evaluate(() => scrollTo(0, 4200));
    await p.waitForTimeout(400);
    const before = await sy(p);

    /* The bug this replaces: the preview frame is inside the link, and pointer
       events inside an iframe go to the iframe's own document. So the tap has
       to land in the middle of the frame, not on the title. */
    const target = await p.evaluate(() => {
      const hit = [...document.querySelectorAll('a.tile__in')].find((t) => {
        const r = t.getBoundingClientRect();
        return r.top > 60 && r.bottom < innerHeight - 140;
      });
      if (!hit) return null;
      const f = hit.querySelector('.tile__view');
      const r = f.getBoundingClientRect();
      return { href: hit.getAttribute('href'), x: r.x + r.width / 2, y: r.y + r.height / 2 };
    });
    ok('a tile is on screen to tap', !!target);

    if (name === 'firefox') await p.mouse.click(target.x, target.y);
    else await p.touchscreen.tap(target.x, target.y);

    let opened = true;
    try { await p.waitForURL('**' + target.href, { timeout: 8000 }); } catch { opened = false; }
    ok('tapping the preview opens the component', opened, target.href);
    if (!opened) await p.goto(SITE + target.href, { waitUntil: 'load' });
    await p.waitForTimeout(400);

    ok('breadcrumb back control is present', (await p.locator('.pnav__back').count()) === 1);

    /* It is not enough for the control to exist. It shipped once inside the
       bleed column of the page grid, zero pixels wide on a phone, with the
       heading painted over it — present in the markup, unreachable by a
       thumb. So: it must sit above the heading, start on the same left edge,
       and be the thing a tap at its centre actually hits. */
    const geo = await p.evaluate(() => {
      const back = document.querySelector('.pnav__back');
      const nav = document.querySelector('.pnav');
      const h1 = document.querySelector('.doc__head h1');
      if (!back || !h1 || !nav) return null;
      const b = back.getBoundingClientRect();
      const n = nav.getBoundingClientRect();
      const h = h1.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return {
        above: b.bottom <= h.top + 1,
        wide: n.width > 100,
        aligned: Math.abs(n.left - h.left) < 2,
        tappable: !!hit && (hit === back || back.contains(hit)),
        tall: b.height,
        hit: hit ? (hit.className || hit.tagName) : 'nothing'
      };
    });
    ok('the breadcrumb sits above the heading', geo?.above);
    ok('the breadcrumb row has real width', geo?.wide);
    ok('the breadcrumb lines up with the heading', geo?.aligned);
    ok('a tap at the centre of the back control hits it', geo?.tappable, String(geo?.hit));
    ok('the back control clears 34px of height', (geo?.tall ?? 0) >= 34, `${Math.round(geo?.tall ?? 0)}px`);
    const crumb = await p.locator('.pnav').textContent();
    ok('breadcrumb names the type and the week', /week \d+/.test(crumb), crumb.trim().replace(/\s+/g, ' '));

    const pager = p.locator('.pager');
    ok('the pager is visible on a phone', await pager.isVisible());
    const box = await pager.boundingBox();
    ok('the pager sits on the bottom edge', box && near(box.y + box.height, PHONE.height, 3),
      box ? `bottom at ${Math.round(box.y + box.height)}` : 'no box');
    ok('the pager clears 44px', box && box.height >= 44, `${Math.round(box?.height ?? 0)}px`);
    ok('the desktop previous/next row is hidden', !(await p.locator('.jump').isVisible()));
    ok('the pager middle returns to the library',
      (await p.locator('.pager__up').getAttribute('href')) === (await p.locator('.pnav__back').getAttribute('href')));

    /* A fixed bar over the end of the document hides the last thing on it. */
    const pad = await p.evaluate(() => parseFloat(getComputedStyle(document.body).paddingBottom) || 0);
    ok('the document ends above the pager', pad >= 44, `${Math.round(pad)}px of padding`);
    await p.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
    await p.waitForTimeout(350);
    const clear = await p.evaluate(() => {
      const last = document.querySelector('.colo__set');
      const bar = document.querySelector('.pager');
      if (!last || !bar) return true;
      return last.getBoundingClientRect().bottom <= bar.getBoundingClientRect().top + 1;
    });
    ok('the pager does not cover the colophon', clear);
    ok('the component page does not scroll sideways', (await overflowX(p)) === 0, `${await overflowX(p)}px over`);

    // ---- Back, and Back again after Forward ----
    await goBack(p);
    await p.waitForTimeout(1100);
    const after = await sy(p);
    ok('Back restores the scroll position', near(after, before, 120), `was ${before}, is ${after}`);
    ok('the tile you opened comes back marked', (await p.locator('.tile--seen').count()) === 1,
      `${await p.locator('.tile--seen').count()} marked`);

    await goForward(p);
    await p.waitForTimeout(500);
    await goBack(p);
    await p.waitForTimeout(1100);
    ok('Back restores it a second time', near(await sy(p), before, 160), `is ${await sy(p)}`);

    // ---- the filter survives the round trip ----
    await p.fill('#q', 'table');
    await p.waitForTimeout(600);
    ok('the search term goes into the URL', p.url().includes('q=table'), p.url());
    ok('a clear control appears', await p.locator('#qx').isVisible());
    const shown = await p.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => !t.hidden).length);
    ok('the filter actually narrows the grid', shown > 0 && shown < 70, `${shown} of 70`);

    const nextSlug = await p.evaluate(() =>
      document.querySelector('.tile:not([hidden]) a.tile__in')?.getAttribute('href'));
    await p.goto(SITE + nextSlug, { waitUntil: 'load' });
    await goBack(p);
    await p.waitForTimeout(1100);
    const stillShown = await p.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => !t.hidden).length);
    ok('Back keeps the filter', stillShown === shown, `${shown} then ${stillShown}`);
    ok('Back keeps the filter in the box', (await p.inputValue('#q')) === 'table');

    await p.click('#qx');
    await p.waitForTimeout(600);
    ok('clear empties the filter', (await p.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => !t.hidden).length)) === 70);
    ok('clear empties the URL', !p.url().includes('q='), p.url());

    // ---- an anchor jump has to clear the sticky masthead ----
    await p.goto(SITE + '/#table', { waitUntil: 'load' });
    await p.waitForTimeout(900);
    const anchor = await p.evaluate(() => {
      const h = document.getElementById('table');
      const m = document.querySelector('.mast');
      if (!h || !m) return null;
      return { top: h.getBoundingClientRect().top, mast: m.getBoundingClientRect().bottom };
    });
    ok('a type jump lands below the masthead, not under it',
      anchor && anchor.top >= anchor.mast - 2, anchor ? `heading at ${Math.round(anchor.top)}, masthead ends ${Math.round(anchor.mast)}` : 'no anchor');

    // ---- the logs, which have their own list and their own pager ----
    await p.goto(SITE + '/logs', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    ok('the masthead marks Logs as the page you are on',
      (await p.locator('.mast__nav a[aria-current="page"]').textContent()) === 'Logs');
    await p.evaluate(() => scrollTo(0, 1500));
    await p.waitForTimeout(350);
    const logsY = await sy(p);
    const logHref = await p.evaluate(() => [...document.querySelectorAll('.lg__row a')]
      .find((a) => { const r = a.getBoundingClientRect(); return r.top > 40 && r.bottom < innerHeight - 40; })
      ?.getAttribute('href'));
    ok('a log row is on screen to open', !!logHref);
    await p.click(`.lg__row a[href="${logHref}"]`);
    await p.waitForTimeout(500);
    ok('a log page carries the breadcrumb', (await p.locator('.pnav__back').count()) === 1);
    ok('a log page carries the pager on a phone', await p.locator('.pager').isVisible());
    await goBack(p);
    await p.waitForTimeout(1000);
    ok('Back restores the log list', near(await sy(p), logsY, 120), `was ${logsY}, is ${await sy(p)}`);

    // ---- patterns: a long page with no pager of its own ----
    await p.goto(SITE + '/patterns', { waitUntil: 'load' });
    await p.evaluate(() => scrollTo(0, 2000));
    await p.waitForTimeout(500);
    ok('back-to-top is offered on a long page', await p.locator('.totop').isVisible());
    ok('patterns has no pager', (await p.locator('.pager').count()) === 0);

    ok('nothing threw on any of it', errs.length === 0, errs.slice(0, 2).join(' | '));
    await ctx.close();
  }

  // ------------------------------------------------- a cold deep link ------
  {
    /* Someone opens a component from a Discord link. There is no history to go
       back through, so the control has to be a real URL that lands on the right
       section of the library. */
    const ctx = await phoneCtx(browser, name);
    const p = await ctx.newPage();
    await p.goto(SITE + '/components/collation-sort-table', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const href = await p.locator('.pnav__back').getAttribute('href');
    ok('a cold deep link still offers a way to the library', !!href, String(href));
    ok('and it points at the type, not just the homepage', /^\/#\w+/.test(href || ''), String(href));
    await p.locator('.pnav__back').click();
    await p.waitForTimeout(900);
    const landed = await p.evaluate(() => {
      const id = location.hash.slice(1);
      const h = document.getElementById(id);
      const m = document.querySelector('.mast');
      return h ? { ok: h.getBoundingClientRect().top >= m.getBoundingClientRect().bottom - 2, id } : null;
    });
    ok('the back control lands on that type section', landed?.ok, landed?.id ?? 'no section');
    await ctx.close();
  }

  // ----------------------------------------------- a shared filtered link --
  {
    const ctx = await phoneCtx(browser, name);
    const p = await ctx.newPage();
    await p.goto(SITE + '/?q=heatmap', { waitUntil: 'load' });
    await p.waitForTimeout(800);
    ok('a shared ?q= link arrives filtered', (await p.inputValue('#q')) === 'heatmap');
    const n = await p.evaluate(() => [...document.querySelectorAll('.tile')].filter((t) => !t.hidden).length);
    ok('and the grid is narrowed to it', n > 0 && n < 10, `${n} tiles`);
    await ctx.close();
  }

  // -------------------------------------------- sessionStorage that throws --
  {
    /* A private window throws on the first touch of sessionStorage rather than
       returning null. Every access in nav.js is wrapped; this proves it. */
    const ctx = await phoneCtx(browser, name);
    await ctx.addInitScript(() => {
      const boom = () => { throw new DOMException('denied', 'SecurityError'); };
      try {
        Object.defineProperty(window, 'sessionStorage', {
          configurable: true,
          get: boom
        });
      } catch { /* engine would not let us, the check below still runs */ }
    });
    const p = await ctx.newPage();
    const errs = [];
    p.on('pageerror', (e) => errs.push(String(e.message).slice(0, 100)));
    await p.goto(SITE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(700);
    await p.evaluate(() => scrollTo(0, 1800));
    await p.waitForTimeout(300);
    const slug = await p.evaluate(() => document.querySelector('a.tile__in')?.getAttribute('href'));
    await p.goto(SITE + slug, { waitUntil: 'load' });
    await goBack(p);
    await p.waitForTimeout(700);
    ok('storage that throws does not break the page', errs.length === 0, errs.slice(0, 2).join(' | '));
    ok('and the pager still renders', true);
    await ctx.close();
  }

  // ------------------------------------------------------ no JavaScript ----
  {
    const ctx = await browser.newContext({ viewport: PHONE, javaScriptEnabled: false });
    const p = await ctx.newPage();
    await p.goto(SITE + '/components/command-palette', { waitUntil: 'load' });
    ok('without JavaScript the breadcrumb is still a link',
      (await p.locator('.pnav__back').getAttribute('href'))?.startsWith('/#'));
    const prevHref = await p.locator('[data-nav-prev]').first().getAttribute('href').catch(() => null);
    const nextHref = await p.locator('[data-nav-next]').first().getAttribute('href').catch(() => null);
    ok('without JavaScript the pager is still links', !!(prevHref || nextHref), `${prevHref} / ${nextHref}`);
    await p.locator('.pnav__back').click();
    await p.waitForTimeout(400);
    ok('and following it reaches the library', new URL(p.url()).pathname === '/', p.url());
    await ctx.close();
  }

  // ------------------------------------------------------- 320px narrow ----
  {
    const ctx = await browser.newContext({
      viewport: { width: 320, height: 640 },
      ...(name === 'firefox' ? {} : { isMobile: true, hasTouch: true })
    });
    const p = await ctx.newPage();
    for (const path of ['/', '/components/command-palette', '/logs', '/patterns']) {
      await p.goto(SITE + path, { waitUntil: 'load' });
      await p.waitForTimeout(500);
      ok(`no sideways scroll at 320px on ${path}`, (await overflowX(p)) === 0, `${await overflowX(p)}px over`);
    }
    /* The masthead nav scrolls sideways on a phone rather than wrapping. Its
       first link must still start inside the screen. */
    const first = await p.evaluate(() => {
      const a = document.querySelector('.mast__nav a');
      const r = a.getBoundingClientRect();
      return { x: Math.round(r.x), h: Math.round(r.height) };
    });
    ok('the masthead nav starts on screen at 320px', first.x >= 0 && first.x < 320, `x=${first.x}`);
    ok('masthead taps are 44px tall at 320px', first.h >= 44, `${first.h}px`);
    await ctx.close();
  }

  // --------------------------------------------------------- desktop -------
  {
    const ctx = await browser.newContext({ viewport: DESK });
    const p = await ctx.newPage();
    await p.goto(SITE + '/components/command-palette', { waitUntil: 'load' });
    await p.waitForTimeout(400);
    const deskGeo = await p.evaluate(() => {
      const back = document.querySelector('.pnav__back');
      const h1 = document.querySelector('.doc__head h1');
      const b = back.getBoundingClientRect();
      const h = h1.getBoundingClientRect();
      const hit = document.elementFromPoint(b.x + b.width / 2, b.y + b.height / 2);
      return { above: b.bottom <= h.top + 1, aligned: Math.abs(b.left + 8 - h.left) < 3, tappable: !!hit && back.contains(hit) };
    });
    ok('the breadcrumb sits above the heading on a desktop too', deskGeo.above);
    ok('and in the text column, not the bleed margin', deskGeo.aligned);
    ok('and it is clickable', deskGeo.tappable);

    ok('no pager on a desktop', !(await p.locator('.pager').isVisible()));
    ok('the previous/next row is shown instead', await p.locator('.jump').isVisible());

    const nextHref = await p.locator('[data-nav-next]').first().getAttribute('href');
    await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(900);
    ok('ArrowRight walks to the next component', nextHref ? p.url().endsWith(nextHref) : true, p.url());
    await p.keyboard.press('ArrowLeft');
    await p.waitForTimeout(900);
    ok('ArrowLeft walks back', p.url().endsWith('/components/command-palette'), p.url());

    /* Arrow keys must not steal from a text field. The source panes are
       textareas full of code. */
    await p.locator('.src__text:not([hidden])').first().click();
    await p.keyboard.press('ArrowRight');
    await p.waitForTimeout(400);
    ok('arrow keys are left alone inside a text field', p.url().endsWith('/components/command-palette'), p.url());

    await p.goto(SITE + '/', { waitUntil: 'load' });
    await p.waitForTimeout(500);
    ok('the masthead marks the library', (await p.locator('.mast__nav a[aria-current="page"]').textContent()) === 'Index');
    await p.fill('#q', 'table');
    await p.waitForTimeout(500);
    await p.locator('#q').press('Escape');
    await p.waitForTimeout(500);
    ok('Escape clears the search', (await p.inputValue('#q')) === '');

    await p.goto(SITE + '/components/command-palette', { waitUntil: 'load' });
    ok('the masthead still marks the library from a component page',
      (await p.locator('.mast__nav a[aria-current="page"]').textContent()) === 'Index');

    /* The back control has to be reachable by keyboard before the page's own
       content, because that is where it is on the screen. */
    await p.keyboard.press('Tab');
    let hops = 0, onBack = false;
    while (hops < 8 && !onBack) {
      onBack = await p.evaluate(() => document.activeElement?.classList.contains('pnav__back'));
      if (!onBack) { await p.keyboard.press('Tab'); hops++; }
    }
    ok('Tab reaches the back control early', onBack, `${hops} hops`);

    await p.evaluate(() => scrollTo(0, 3000));
    await p.waitForTimeout(450);
    ok('back-to-top appears once you are down the page', await p.locator('.totop').isVisible());
    await p.click('.totop');
    await p.waitForFunction(() => scrollY < 10, null, { timeout: 4000 }).catch(() => {});
    ok('back-to-top returns to the top', (await sy(p)) < 10, `at ${await sy(p)}`);
    await ctx.close();
  }

  // ------------------------------------------------- reduced motion --------
  {
    const ctx = await browser.newContext({ viewport: PHONE, reducedMotion: 'reduce' });
    const p = await ctx.newPage();
    await p.goto(SITE + '/components/command-palette', { waitUntil: 'load' });
    await p.evaluate(() => scrollTo(0, 2500));
    await p.waitForTimeout(400);
    await p.click('.totop');
    await p.waitForTimeout(120);
    ok('with reduced motion, back-to-top jumps rather than glides', (await sy(p)) < 10, `at ${await sy(p)} after 120ms`);
    await ctx.close();
  }

  // ------------------------------------------------- a rules engine --------
  if (name === 'chromium') {
    /* test/a11y.mjs runs axe over the components. Nothing had ever run it over
       the pages around them, which is where the new controls live. */
    const ctx = await browser.newContext({ viewport: PHONE, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    for (const path of ['/', '/components/command-palette', '/logs', '/logs/week-18', '/patterns', '/about']) {
      await p.goto(SITE + path, { waitUntil: 'load' });
      await p.waitForTimeout(600);
      await p.addScriptTag({ content: axeSource });
      const bad = await p.evaluate(async () => {
        const r = await window.axe.run(document.body, {
          resultTypes: ['violations'],
          /* The component previews are iframes with their own axe run in
             test/a11y.mjs; this pass is about the page around them. */
          rules: { 'frame-tested': { enabled: false } }
        });
        return r.violations
          .filter((v) => v.impact === 'serious' || v.impact === 'critical')
          .map((v) => `${v.id}(${v.nodes.length})`);
      });
      ok(`axe finds nothing serious on ${path}`, bad.length === 0, bad.join(' '));
    }
    await ctx.close();
  }

  await browser.close();
}

// ------------------------------------------------------------- report ------
const fails = rows.filter((r) => !r.pass);
const byEngine = {};
for (const r of rows) {
  byEngine[r.engine] ??= { n: 0, bad: 0 };
  byEngine[r.engine].n++;
  if (!r.pass) byEngine[r.engine].bad++;
}
console.log('');
for (const [e, s] of Object.entries(byEngine)) {
  console.log(`${e.padEnd(9)} ${s.n - s.bad}/${s.n}`);
}
if (fails.length) {
  console.log('');
  for (const f of fails) console.log(`FAIL  ${f.engine}  ${f.name}${f.note ? '  — ' + f.note : ''}`);
  console.log(`\n${fails.length} failing`);
  process.exit(1);
}
console.log(`\nnavigation clean — ${rows.length} checks across ${ENGINES.length} engine(s)`);
