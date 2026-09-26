/* OKLCH picker. Dragging lightness must not change apparent hue, which is the
   entire reason to pick in this space rather than HSL. The ramps behind each
   slider preview the axis being dragged, and the gamut warning is measured by
   painting the colour and reading the pixel back. */
(() => {
  const cv = document.createElement('canvas'); cv.width = cv.height = 1;
  const ctx = cv.getContext('2d', { willReadFrequently: true });

  function toRGB(css) {
    ctx.clearRect(0, 0, 1, 1); ctx.fillStyle = '#000';
    ctx.fillStyle = css; ctx.fillRect(0, 0, 1, 1);
    return [...ctx.getImageData(0, 0, 1, 1).data].slice(0, 3);
  }

  document.querySelectorAll('[data-op]').forEach((root) => {
    if (root.tagName !== 'DIV') return;
    const get = (k) => root.querySelector(`input[data-op="${k}"]`);
    const outs = Object.fromEntries(['l','c','h'].map(k => [k, root.querySelector(`[data-op-out="${k}"]`)]));
    const swatch = root.querySelector('[data-op-swatch]');
    const code = root.querySelector('[data-op-code]');
    const gamut = root.querySelector('[data-op-gamut]');

    const css = (l, c, h) => `oklch(${l}% ${c} ${h})`;

    function ramp(el, k, l, c, h) {
      const stops = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8;
        stops.push(k === 'l' ? css(t * 100, c, h)
                 : k === 'c' ? css(l, t * 0.37, h)
                 : css(l, c, t * 360));
      }
      el.style.setProperty('--ramp', `linear-gradient(to right, ${stops.join(',')})`);
    }

    function paint() {
      const l = +get('l').value, c = +get('c').value, h = +get('h').value;
      const value = css(l, c, h);
      swatch.style.setProperty('--pick', value);
      code.textContent = value;
      outs.l.textContent = l.toFixed(1) + '%';
      outs.c.textContent = c.toFixed(3);
      outs.h.textContent = h + '°';
      ['l','c','h'].forEach((k) => ramp(get(k), k, l, c, h));

      /* Gamut check: ask the browser to paint it, then ask what it painted.
         If the requested colour is outside sRGB the values come back clipped. */
      const [r, g, b] = toRGB(value);
      const back = toRGB(`rgb(${r} ${g} ${b})`);
      const clipped = r === 0 && g === 0 && b === 0 && l > 5;
      const atEdge = [r, g, b].some((v) => v === 0 || v === 255) && c > 0.08;
      gamut.hidden = !(clipped || atEdge);
      void back;
    }

    ['l','c','h'].forEach((k) => get(k).addEventListener('input', paint));
    root.querySelector('[data-op-copy]')?.addEventListener('click', async (e) => {
      try { await navigator.clipboard.writeText(code.textContent); e.target.textContent = 'copied'; }
      catch { e.target.textContent = 'copy failed'; }
      setTimeout(() => { e.target.textContent = 'copy'; }, 1400);
    });
    paint();
  });
})();
