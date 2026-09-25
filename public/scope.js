/* The scope: shows the palette being derived rather than asserting it.
   Left, the hue histogram the extractor actually builds from the image.
   Right, every contrast pair in the generated palette, measured. */
(() => {
  const BINS = 36;

  const srgbToLinear = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };

  function relLuminance(r, g, b) {
    const [R, G, B] = [r, g, b].map(srgbToLinear);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function ratio(a, b) {
    const la = relLuminance(...a), lb = relLuminance(...b);
    const hi = Math.max(la, lb), lo = Math.min(la, lb);
    return (hi + 0.05) / (lo + 0.05);
  }

  /* Resolve an oklch() token to rgb by letting the browser do the conversion. */
  const probe = document.createElement('span');
  probe.style.display = 'none';
  document.body.append(probe);
  function rgbOf(token) {
    probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
    const m = getComputedStyle(probe).color.match(/[\d.]+/g);
    return m ? m.slice(0, 3).map(Number) : [0, 0, 0];
  }

  function histogram(img) {
    const N = 64, cv = document.createElement('canvas');
    cv.width = cv.height = N;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, N, N);
    const { data } = ctx.getImageData(0, 0, N, N);
    const bins = new Float64Array(BINS);
    for (let i = 0; i < data.length; i += 4) {
      if (data[i + 3] < 128) continue;
      const lr = srgbToLinear(data[i]), lg = srgbToLinear(data[i + 1]), lb = srgbToLinear(data[i + 2]);
      const l = Math.cbrt(0.4122214708*lr + 0.5363325363*lg + 0.0514459929*lb);
      const m = Math.cbrt(0.2119034982*lr + 0.6806995451*lg + 0.1073969566*lb);
      const s = Math.cbrt(0.0883024619*lr + 0.2817188376*lg + 0.6299787005*lb);
      const A = 1.9779984951*l - 2.4285922050*m + 0.4505937099*s;
      const B = 0.0259040371*l + 0.7827717662*m - 0.8086757660*s;
      const c = Math.hypot(A, B);
      if (c < 0.015) continue;
      let h = Math.atan2(B, A) * 180 / Math.PI; if (h < 0) h += 360;
      bins[Math.floor(h / (360 / BINS)) % BINS] += c;
    }
    return bins;
  }

  function drawHistogram(el, bins) {
    const peak = Math.max(...bins) || 1;
    const hue = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--h'));
    const acc = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ha'));
    const step = 360 / BINS;
    const chosen = Math.floor(hue / step), accent = Math.floor(acc / step);

    el.textContent = '';
    bins.forEach((v, i) => {
      const bar = document.createElement('div');
      bar.className = 'scope__bar';
      bar.style.height = Math.max(2, (v / peak) * 100) + '%';
      bar.style.background = `oklch(62% 0.17 ${i * step + step / 2})`;
      if (i === chosen) bar.dataset.mark = 'page';
      else if (i === accent) bar.dataset.mark = 'accent';
      bar.title = `${Math.round(i * step)}°`;
      el.append(bar);
    });
  }

  const PAIRS = [
    ['--text', '--bg', 'ink on page', 4.5],
    ['--text-dim', '--bg', 'muted on page', 4.5],
    ['--text', '--surface', 'ink on field', 4.5],
    ['--accent', '--bg', 'accent on page', 3],
    ['--accent-fg', '--accent', 'label on accent', 4.5],
    ['--border', '--bg', 'rule on page', 1.5]
  ];

  function drawContrast(el) {
    el.textContent = '';
    for (const [fg, bg, label, floor] of PAIRS) {
      const r = ratio(rgbOf(fg), rgbOf(bg));
      const row = document.createElement('div');
      row.className = 'scope__row';
      row.dataset.pass = String(r >= floor);
      const sw = document.createElement('span');
      sw.className = 'scope__pair';
      sw.style.background = `var(${bg})`;
      sw.style.color = `var(${fg})`;
      sw.textContent = 'Ag';
      const nm = document.createElement('span'); nm.className = 'scope__name'; nm.textContent = label;
      const vl = document.createElement('span'); vl.className = 'scope__val';
      vl.textContent = r.toFixed(2) + ':1';
      row.append(sw, nm, vl);
      el.append(row);
    }
  }

  function refresh(imgSrc) {
    const bars = document.getElementById('scope-hist');
    const rows = document.getElementById('scope-contrast');
    if (rows) drawContrast(rows);
    if (!bars || !imgSrc) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => drawHistogram(bars, histogram(img));
    img.src = imgSrc;
  }

  let current = '/wallpapers/dusk.svg';
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-wall]');
    if (b) { current = b.dataset.wall; setTimeout(() => refresh(current), 80); }
  });
  addEventListener('prism:theme', () => setTimeout(() => refresh(current), 30));
  addEventListener('DOMContentLoaded', () => refresh(current));
  window.prismScope = { refresh, ratio, rgbOf };
})();
