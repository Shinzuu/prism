import { chromium } from 'playwright';
const BASE = process.env.BASE || 'https://prism.shinzuu-dev.workers.dev';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(BASE, { waitUntil: 'networkidle' });
await p.waitForTimeout(3200);           // let the load sequence finish

const tok = await p.evaluate(() => {
  const cs = getComputedStyle(document.documentElement);
  const g = (n) => cs.getPropertyValue(n).trim();
  const probe = document.createElement('span');
  document.body.append(probe);
  const rgb = (n) => { probe.style.color = cs.getPropertyValue(n); return getComputedStyle(probe).color; };
  return { h: g('--h'), c: g('--c'), ha: g('--ha'), ca: g('--ca'),
           bg: rgb('--bg'), text: rgb('--text'), accent: rgb('--accent'), surface: rgb('--surface') };
});
console.log('palette:', JSON.stringify(tok, null, 0));

const lum = (s) => { const [r,g,bl] = s.match(/[\d.]+/g).slice(0,3).map(Number);
  const f=(v)=>{v/=255;return v<=0.04045?v/12.92:Math.pow((v+0.055)/1.055,2.4);};
  return 0.2126*f(r)+0.7152*f(g)+0.0722*f(bl); };
const ratio = (a,b)=>{const x=lum(a),y=lum(b);const hi=Math.max(x,y),lo=Math.min(x,y);return (hi+0.05)/(lo+0.05);};
console.log('contrast text/bg   :', ratio(tok.text, tok.bg).toFixed(2));
console.log('contrast accent/bg :', ratio(tok.accent, tok.bg).toFixed(2));
console.log('contrast text/surf :', ratio(tok.text, tok.surface).toFixed(2));

const draw = await p.evaluate(() => {
  const els = [...document.querySelectorAll('.ln')];
  const unfinished = els.filter(e => parseFloat(getComputedStyle(e).strokeDashoffset) > 1);
  return { parts: els.length, unfinished: unfinished.length,
           filled: els.filter(e => parseFloat(getComputedStyle(e).fillOpacity) > .5).length };
});
console.log('airframe:', JSON.stringify(draw));
await p.screenshot({ path: 'test/hero.png', clip: { x: 0, y: 0, width: 1440, height: 820 } });
await b.close();
