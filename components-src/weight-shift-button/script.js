/* The motion is entirely CSS; this only reports the live axis values and
   handles the release overshoot. Both axes are registered with @property in
   the stylesheet — without that registration the transition is accepted,
   throws nothing, and does nothing at all. */
(() => {
  document.querySelectorAll('[data-wsb]').forEach((root) => {
    const btn = root.querySelector('[data-wsb-btn]');
    const read = root.querySelector('[data-wsb-read]');
    let raf = 0;

    const report = () => {
      const cs = getComputedStyle(btn);
      const w = parseFloat(cs.getPropertyValue('--wsb-wght'));
      const d = parseFloat(cs.getPropertyValue('--wsb-wdth'));
      read.textContent = 'wght ' + (Number.isFinite(w) ? w.toFixed(0) : '—') +
        ' · wdth ' + (Number.isFinite(d) ? d.toFixed(0) : '—');
      raf = requestAnimationFrame(report);
    };

    const hold = () => { btn.removeAttribute('data-released'); btn.dataset.holding = ''; };
    const release = () => {
      if (!btn.hasAttribute('data-holding')) return;
      btn.removeAttribute('data-holding');
      // Undershoot past rest, then let it settle back — a spring, not a fade.
      btn.dataset.released = '';
      setTimeout(() => btn.removeAttribute('data-released'), 170);
    };

    btn.addEventListener('pointerdown', (e) => { btn.setPointerCapture(e.pointerId); hold(); });
    btn.addEventListener('pointerup', release);
    btn.addEventListener('pointercancel', release);
    btn.addEventListener('pointerleave', release);
    // Space and Enter are the keyboard equivalent of press-and-hold.
    btn.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') hold(); });
    btn.addEventListener('keyup', (e) => { if (e.key === ' ' || e.key === 'Enter') release(); });
    btn.addEventListener('blur', release);

    // Only sample while the component is on screen.
    new IntersectionObserver((es) => {
      for (const e of es) {
        cancelAnimationFrame(raf);
        if (e.isIntersecting) report();
      }
    }, { rootMargin: '60px' }).observe(root);
  });
})();
