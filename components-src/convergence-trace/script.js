/* A spinner says "something is happening". This says how fast the error is
   falling, which on a log axis is a straight line whose slope predicts the
   finish — and whose flattening is the only honest way to show "stuck". */
(() => {
  const W = 300, H = 96, PAD = 6;
  const TOP = 1, FLOOR = 1e-7, TARGET = 1e-6;

  // Map a residual to a y pixel through its log. Linear would put every value
  // after the second iteration inside one pixel of the bottom edge.
  const y = (r) => {
    const t = Math.log10(Math.max(r, FLOOR)) / Math.log10(FLOOR / TOP);
    return PAD + t * (H - PAD * 2);
  };

  document.querySelectorAll('[data-ct]').forEach((root) => {
    const line = root.querySelector('[data-ct-line]');
    const fit = root.querySelector('[data-ct-fit]');
    const dot = root.querySelector('[data-ct-dot]');
    const grid = root.querySelector('[data-ct-grid]');
    const resOut = root.querySelector('[data-ct-res]');
    const etaOut = root.querySelector('[data-ct-eta]');
    const note = root.querySelector('[data-ct-note]');

    for (const decade of [1e-1, 1e-2, 1e-3, 1e-4, 1e-5, 1e-6]) {
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('x1', 0); ln.setAttribute('x2', W);
      ln.setAttribute('y1', y(decade)); ln.setAttribute('y2', y(decade));
      grid.append(ln);
    }

    const MAX = 44;
    let pts = [], res = 0.8, i = 0, timer;

    // A real solver: fast at first, then a stall, then it breaks through.
    const step = () => {
      const rate = (i > 13 && i < 24) ? 0.985 : 0.62;
      res *= rate * (0.94 + Math.random() * 0.12);
      pts.push(res); i++;

      const x = (n) => PAD + (n / (MAX - 1)) * (W - PAD * 2);
      line.setAttribute('d', pts.map((r, n) => (n ? 'L' : 'M') + x(n) + ' ' + y(r)).join(' '));
      dot.setAttribute('cx', x(pts.length - 1));
      dot.setAttribute('cy', y(res));
      resOut.textContent = res.toExponential(1);

      /* Least-squares fit over the last eight points, in LOG space — that is
         what makes the slope a constant to extrapolate rather than a curve. */
      const tail = pts.slice(-8);
      if (tail.length >= 4) {
        const n0 = pts.length - tail.length;
        const xs = tail.map((_, k) => n0 + k);
        const ys = tail.map((r) => Math.log10(Math.max(r, FLOOR)));
        const mx = xs.reduce((a, b) => a + b) / xs.length;
        const my = ys.reduce((a, b) => a + b) / ys.length;
        let num = 0, den = 0;
        xs.forEach((xv, k) => { num += (xv - mx) * (ys[k] - my); den += (xv - mx) ** 2; });
        const slope = den ? num / den : 0;

        // Decades per iteration. Too shallow to matter means stalled.
        const stalled = slope > -0.02;
        const left = stalled ? Infinity : (Math.log10(TARGET) - Math.log10(res)) / slope;

        root.dataset.ctState = res <= TARGET ? 'done' : stalled ? 'stalled' : 'running';
        etaOut.textContent = res <= TARGET ? 'converged'
          : stalled ? 'stalled — slope flat'
          : '~' + Math.max(1, Math.ceil(left)) + ' iterations left';

        const fx = x(Math.min(MAX - 1, pts.length - 1 + Math.max(0, Math.min(40, left))));
        fit.setAttribute('d', 'M' + x(pts.length - 1) + ' ' + y(res) + ' L' + fx + ' ' +
          y(stalled ? res : TARGET));
      }

      if (res <= TARGET || pts.length >= MAX) {
        clearTimeout(timer);
        note.textContent = res <= TARGET
          ? 'Converged. The dashed line was the extrapolation from the log slope.'
          : 'Ran out of iterations — the flat stretch is visible, not hidden.';
        timer = setTimeout(() => { pts = []; res = 0.8; i = 0; note.textContent = ''; run(); }, 2200);
        return;
      }
      timer = setTimeout(step, 150);
    };

    const run = () => { timer = setTimeout(step, 150); };

    // Do not animate off-screen, and stop entirely if motion is unwelcome.
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      for (let k = 0; k < 18; k++) { res *= 0.62; pts.push(res); }
      step();
      clearTimeout(timer);
      return;
    }
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) run(); else clearTimeout(timer);
      }
    }, { rootMargin: '80px' }).observe(root);
  });
})();
