/* prism theme engine
   Pulls hue + chroma out of an image. Lightness stays on the fixed ladder
   in tokens.css, so every generated palette keeps its contrast. */
(() => {
  const KEY = 'prism-theme';
  const root = document.documentElement;

  const srgbToLinear = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };

  // sRGB -> OKLab (Björn Ottosson's matrices)
  function oklab(r, g, b) {
    const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
    const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
    const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
    const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;
    const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
    return {
      L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    };
  }

  const BINS = 36;              // 10 degrees per bin

  function extract(img) {
    const N = 48;
    const cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, N, N);
    const { data } = ctx.getImageData(0, 0, N, N);

    const weight = new Float64Array(BINS);
    const chroma = new Float64Array(BINS);
    let chromaticPixels = 0;

    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const { a, b } = oklab(data[i], data[i + 1], data[i + 2]);
      const c = Math.hypot(a, b);
      if (c < 0.015) continue;                  // ignore greys, they carry no hue
      chromaticPixels++;
      let hue = Math.atan2(b, a) * 180 / Math.PI;
      if (hue < 0) hue += 360;
      const bin = Math.floor(hue / (360 / BINS)) % BINS;
      weight[bin] += c;                          // saturated pixels count for more
      chroma[bin] += c;
    }

    // a near-greyscale image gets a sane default rather than a random hue
    if (chromaticPixels < 40) return { h: 264, c: 0.03, ha: 264, ca: 0.11 };

    let peak = 0;
    for (let i = 1; i < BINS; i++) if (weight[i] > weight[peak]) peak = i;

    // accent = strongest hue at least 60 degrees away, else the dominant hue itself
    let accent = peak, best = -1;
    for (let i = 0; i < BINS; i++) {
      const d = Math.min(Math.abs(i - peak), BINS - Math.abs(i - peak)) * (360 / BINS);
      if (d >= 60 && weight[i] > best) { best = weight[i]; accent = i; }
    }

    const step = 360 / BINS;
    const meanC = (bin) => Math.min(chroma[bin] / Math.max(weight[bin] / 0.1, 1), 0.2);

    return {
      h: peak * step + step / 2,
      c: Math.max(0.02, Math.min(meanC(peak) || 0.05, 0.07)),
      ha: accent * step + step / 2,
      ca: Math.max(0.10, Math.min(meanC(accent) * 2 || 0.16, 0.20))
    };
  }

  function apply(p) {
    root.style.setProperty('--h', p.h.toFixed(1));
    root.style.setProperty('--c', p.c.toFixed(4));
    root.style.setProperty('--ha', p.ha.toFixed(1));
    root.style.setProperty('--ca', p.ca.toFixed(4));
    announce();
  }

  /* Previews render in iframes, which do not inherit the page's custom properties.
     Anything that needs the current palette listens for this. */
  function announce() {
    window.dispatchEvent(new CustomEvent('prism:theme', { detail: tokens() }));
  }

  const TOKEN_NAMES = ['--h','--c','--ha','--ca','--bg','--surface','--raised','--border',
    '--text-dim','--text','--accent','--accent-fg','--accent-dim','--radius','--shadow',
    '--mono','--sans'];

  function tokens() {
    const cs = getComputedStyle(root);
    const out = {};
    for (const n of TOKEN_NAMES) out[n] = cs.getPropertyValue(n).trim();
    out['color-scheme'] = cs.getPropertyValue('color-scheme').trim() || 'light';
    return out;
  }

  function save(p, mode) {
    try { localStorage.setItem(KEY, JSON.stringify({ p, mode })); } catch {}
  }

  function restore() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const { p, mode } = JSON.parse(raw);
      if (p) apply(p);
      if (mode) root.setAttribute('data-theme', mode);
    } catch {}
  }

  function fromImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const p = extract(img);
        apply(p);
        save(p, root.getAttribute('data-theme'));
        resolve(p);
      };
      img.onerror = reject;
      img.src = src;
    });
  }

  function toggleMode() {
    const now = root.getAttribute('data-theme')
      || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = now === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    announce();
    try {
      const raw = localStorage.getItem(KEY);
      const prev = raw ? JSON.parse(raw).p : null;
      save(prev, next);
    } catch {}
    return next;
  }

  /* Preview frames announce themselves when ready; answer with the live palette,
     and push every later change to all of them. */
  const frames = new Set();
  addEventListener('message', (e) => {
    if (!e.data || e.data.prism !== 'ready' || !e.source) return;
    frames.add(e.source);
    e.source.postMessage({ prism: 'tokens', tokens: tokens() }, '*');
  });
  addEventListener('prism:theme', (e) => {
    for (const f of frames) {
      try { f.postMessage({ prism: 'tokens', tokens: e.detail }, '*'); }
      catch { frames.delete(f); }
    }
  });

  restore();
  window.prism = { fromImage, toggleMode, extract, apply, tokens, announce };
  addEventListener('DOMContentLoaded', announce);
})();
