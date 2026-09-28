/* The wordmark narrows as the panel scrolls. Narrowing, not shrinking:
   transform: scaleX() squashes the existing outlines, thinning the vertical
   stems while leaving the horizontals alone, which is exactly what a type
   designer avoids. The wdth axis redraws the letterforms at a narrower
   proportion with their stroke weights intact. */
(() => {
  const MIN_WDTH = 62, MAX_WDTH = 125;   // Archivo's designed range
  const MIN_WGHT = 620, MAX_WGHT = 780;

  document.querySelectorAll('[data-scw]').forEach((root) => {
    const scroller = root.querySelector('[data-scw-scroll]');
    const mark = root.querySelector('[data-scw-mark]');
    const read = root.querySelector('[data-scw-read]');
    let ticking = false;

    const apply = () => {
      ticking = false;
      const max = scroller.scrollHeight - scroller.clientHeight;
      const t = max > 0 ? Math.min(1, scroller.scrollTop / Math.min(max, 140)) : 0;
      const wdth = MAX_WDTH - (MAX_WDTH - MIN_WDTH) * t;
      const wght = MAX_WGHT - (MAX_WGHT - MIN_WGHT) * t;
      mark.style.setProperty('--scw-wdth', wdth.toFixed(1));
      mark.style.setProperty('--scw-wght', wght.toFixed(0));
      read.textContent = 'wdth ' + wdth.toFixed(0) + '% · wght ' + wght.toFixed(0) +
        ' · mark width ' + Math.round(mark.getBoundingClientRect().width) + 'px';
    };

    // rAF-throttled: a scroll handler that writes styles on every event forces
    // layout far more often than the screen can show it.
    scroller.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }, { passive: true });

    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // Still functional, just not animated: hold the wide setting.
      mark.style.setProperty('--scw-wdth', MAX_WDTH);
      read.textContent = 'reduced motion — axis held at wdth ' + MAX_WDTH + '%';
      return;
    }
    apply();
  });
})();
