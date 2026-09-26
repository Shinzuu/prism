/* A two-thumb filter drawn over the distribution it filters, so you can see
   what each end of the drag will cost you before you let go. */
(() => {
  const MIN = 0, MAX = 500, BINS = 32;
  const money = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 });

  document.querySelectorAll('[data-hr]').forEach((root) => {
    const chart = root.querySelector('[data-hr-chart]');
    const barsEl = root.querySelector('[data-hr-bars]');
    const band = root.querySelector('[data-hr-band]');
    const out = root.querySelector('[data-hr-out]');
    const count = root.querySelector('[data-hr-count]');
    const thumbs = { lo: root.querySelector('[data-hr-thumb="lo"]'), hi: root.querySelector('[data-hr-thumb="hi"]') };
    let lo = 80, hi = 340, drag = null;

    // A believable long tail, so the chart is worth looking at.
    const counts = Array.from({ length: BINS }, (_, i) => {
      const x = (i + 0.5) / BINS * MAX;
      const a = Math.exp(-((x - 120) ** 2) / (2 * 70 ** 2)) * 180;
      const b = Math.exp(-((x - 300) ** 2) / (2 * 55 ** 2)) * 70;
      return Math.round(a + b + 4);
    });
    const peak = Math.max(...counts);
    const bars = counts.map((c) => {
      const i = document.createElement('i');
      i.style.height = Math.max(3, (c / peak) * 100) + '%';
      barsEl.append(i);
      return i;
    });

    const pct = (v) => ((v - MIN) / (MAX - MIN)) * 100;
    const valueAt = (clientX) => {
      const b = chart.getBoundingClientRect();
      return Math.round(MIN + ((clientX - b.left) / b.width) * (MAX - MIN));
    };

    function paint() {
      thumbs.lo.style.left = pct(lo) + '%';
      thumbs.hi.style.left = pct(hi) + '%';
      band.style.left = pct(lo) + '%';
      band.style.width = (pct(hi) - pct(lo)) + '%';
      out.textContent = money.format(lo) + ' – ' + money.format(hi);

      let inRange = 0, total = 0;
      counts.forEach((c, i) => {
        const x = (i + 0.5) / BINS * MAX;
        const on = x >= lo && x <= hi;
        bars[i].dataset.in = String(on);
        total += c; if (on) inRange += c;
      });
      // The number the drag actually costs you, stated before you commit.
      count.textContent = inRange.toLocaleString() + ' of ' + total.toLocaleString() +
        ' results (' + Math.round((inRange / total) * 100) + '%)';

      for (const [k, el] of Object.entries(thumbs)) {
        const v = k === 'lo' ? lo : hi;
        el.setAttribute('aria-valuenow', v);
        el.setAttribute('aria-valuetext', (k === 'lo' ? 'Minimum ' : 'Maximum ') + money.format(v));
        el.setAttribute('aria-valuemin', k === 'lo' ? MIN : lo);
        el.setAttribute('aria-valuemax', k === 'lo' ? hi : MAX);
      }
    }

    function set(which, v) {
      // Thumbs collide rather than swap: a filter whose ends trade places
      // produces a range the user never asked for.
      if (which === 'lo') lo = Math.max(MIN, Math.min(v, hi));
      else hi = Math.min(MAX, Math.max(v, lo));
      paint();
    }

    Object.entries(thumbs).forEach(([k, el]) => {
      el.addEventListener('pointerdown', (e) => { drag = k; el.setPointerCapture(e.pointerId); });
      el.addEventListener('pointermove', (e) => { if (drag === k) set(k, valueAt(e.clientX)); });
      el.addEventListener('pointerup', () => { drag = null; });
      el.addEventListener('keydown', (e) => {
        const step = e.shiftKey ? 25 : 5;
        const v = k === 'lo' ? lo : hi;
        if (e.key === 'ArrowRight' || e.key === 'ArrowUp') { e.preventDefault(); set(k, v + step); }
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') { e.preventDefault(); set(k, v - step); }
        else if (e.key === 'Home') { e.preventDefault(); set(k, k === 'lo' ? MIN : lo); }
        else if (e.key === 'End') { e.preventDefault(); set(k, k === 'lo' ? hi : MAX); }
      });
    });

    chart.addEventListener('pointerdown', (e) => {
      if (e.target.closest('[data-hr-thumb]')) return;
      const v = valueAt(e.clientX);
      set(Math.abs(v - lo) <= Math.abs(v - hi) ? 'lo' : 'hi', v);   // nearest thumb jumps
    });

    paint();
  });
})();
