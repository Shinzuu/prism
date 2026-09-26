/* A number that remembers it has a unit. Arrow keys step the value and leave
   the unit alone, which is the thing a plain number input cannot do and the
   reason designers end up retyping "px" forty times a day. */
(() => {
  const ROOT_PX = 16;
  const UNITS = ['px', 'rem', 'em', '%', 'ch', 'vw', 'vh', 'cqi'];
  const RE = /^\s*(-?\d*\.?\d+)\s*([a-z%]*)\s*$/i;

  document.querySelectorAll('[data-uf]').forEach((root) => {
    const input = root.querySelector('.uf__input');
    const unitEl = root.querySelector('[data-uf-unit]');
    const conv = root.querySelector('[data-uf-conv]');

    function parse(raw) {
      const m = RE.exec(raw);
      if (!m) return null;
      const n = parseFloat(m[1]);
      const u = (m[2] || '').toLowerCase();
      if (!Number.isFinite(n)) return null;
      if (u && !UNITS.includes(u)) return null;
      return { n, u: u || 'px' };
    }

    function decimals(raw) {
      const dot = raw.indexOf('.');
      return dot === -1 ? 0 : raw.length - dot - 1;
    }

    function render(v, raw) {
      unitEl.textContent = v ? v.u : '';
      input.setAttribute('aria-invalid', String(!v));
      conv.textContent = '';
      if (!v) return;
      // Only conversions that are actually defined without layout context.
      const px = v.u === 'px' ? v.n : v.u === 'rem' || v.u === 'em' ? v.n * ROOT_PX : null;
      const pairs = [];
      if (px !== null) {
        pairs.push(['px', px.toFixed(px % 1 ? 2 : 0)]);
        pairs.push(['rem', (px / ROOT_PX).toFixed(4).replace(/\.?0+$/, '')]);
      } else {
        pairs.push(['relative', 'depends on container']);
      }
      for (const [k, val] of pairs) {
        const d = document.createElement('div');
        const dt = document.createElement('dt'); dt.textContent = k;
        const dd = document.createElement('dd'); dd.textContent = val;
        d.append(dt, dd); conv.append(d);
      }
    }

    function step(dir, e) {
      const v = parse(input.value);
      if (!v) return;
      const mult = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      // Step in the unit's own granularity: 1px is coarse, 1rem is enormous.
      const base = v.u === 'px' || v.u === '%' || v.u === 'vw' || v.u === 'vh' ? 1 : 0.1;
      const next = v.n + dir * base * mult;
      const dp = Math.max(decimals(String(base * mult)), 0);
      input.value = (Math.abs(next) < 1e-6 ? 0 : +next.toFixed(dp + 2)).toString().replace(/\.?0+$/, '') + v.u;
      render(parse(input.value), input.value);
    }

    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') { e.preventDefault(); step(1, e); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); step(-1, e); }
    });
    input.addEventListener('input', () => render(parse(input.value), input.value));
    input.addEventListener('blur', () => {
      const v = parse(input.value);
      if (v) input.value = v.n + v.u;          // normalise only on blur, never while typing
      render(v, input.value);
    });
    render(parse(input.value), input.value);
  });
})();
