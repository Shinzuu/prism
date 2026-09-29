/* Visual sweep of the pages that are prose rather than components. The
   component previews are covered by qa.mjs and visual.mjs; these pages have no
   assertions worth writing, so they are captured for a human to look at. */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const SITE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const OUT = process.env.OUT || 'test/shots';
mkdirSync(OUT, { recursive: true });

const PAGES = [
  ['index', '/'],
  ['patterns', '/patterns'],
  ['logs', '/logs'],
  ['log-week-01', '/logs/week-01'],
  ['component', '/components/command-palette'],
  ['about', '/about'],
];
const VIEWS = [
  ['desktop', 1440, 900],
  ['phone', 390, 844],
];

const browser = await chromium.launch();

for (const [theme, colorScheme] of [['light', 'light'], ['dark', 'dark']]) {
  for (const [vname, width, height] of VIEWS) {
    /* Dark mode is a stored choice, not only a media query, so set both: the
       page reads localStorage first and would otherwise render light. */
    const ctx = await browser.newContext({ viewport: { width, height }, colorScheme });
    const page = await ctx.newPage();

    for (const [name, path] of PAGES) {
      await page.goto(`${SITE}${path}`, { waitUntil: 'load' });
      /* theme.js locks the document to light on load, so dark is reached the
         same way test/dark.mjs reaches it: set the attribute after init. */
      if (theme === 'dark') {
        await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
      }
      /* Let the hero timeline and any reveal settle before the shutter. */
      await page.waitForTimeout(2600);
      const file = `${OUT}/${name}-${vname}-${theme}.png`;
      await page.screenshot({ path: file, fullPage: false });
      console.log(file);
    }
    await ctx.close();
  }
}

await browser.close();
