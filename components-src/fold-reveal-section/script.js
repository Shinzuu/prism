/* The fold is entirely CSS — animation-timeline: view() drives it from the
   scroller, with no scroll listener and nothing running on the main thread.
   This file only reports which path the browser took, because the difference
   between "unsupported" and "broken" is otherwise invisible. */
(() => {
  document.querySelectorAll('[data-frs]').forEach((root) => {
    const note = root.querySelector('[data-frs-note]');
    const supported = CSS.supports('animation-timeline: view()');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    note.textContent = reduced
      ? 'reduced motion — panels shown open, no fold'
      : supported
        ? 'animation-timeline: view() — no scroll listener, no main-thread work'
        : 'scroll-driven animations unsupported — panels shown open';
  });
})();
