/* Spotlight card: the pointer lights the surface and tilts it.
   Position is written as custom properties so all the visual work stays in CSS,
   and every frame is scheduled on rAF so a fast pointer cannot flood layout. */
(() => {
  const MAX_TILT = 6;           // degrees; past about 8 it reads as a gimmick

  document.querySelectorAll('[data-sc]').forEach((root) => {
    root.querySelectorAll('.sc__card').forEach((card) => {
      let frame = 0;
      let pending = null;

      function paint() {
        frame = 0;
        if (!pending) return;
        const { x, y, w, h } = pending;
        card.style.setProperty('--mx', (x / w) * 100 + '%');
        card.style.setProperty('--my', (y / h) * 100 + '%');
        const rx = (0.5 - y / h) * 2 * MAX_TILT;
        const ry = (x / w - 0.5) * 2 * MAX_TILT;
        card.style.transform = `perspective(720px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
      }

      function track(e) {
        const r = card.getBoundingClientRect();
        pending = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
        if (!frame) frame = requestAnimationFrame(paint);
      }

      function light() { card.style.setProperty('--lit', '1'); }

      function rest() {
        card.style.setProperty('--lit', '0');
        card.style.transform = '';
        card.style.removeProperty('--mx');
        card.style.removeProperty('--my');
      }

      card.addEventListener('pointerenter', light);
      card.addEventListener('pointermove', track);
      card.addEventListener('pointerleave', rest);

      /* Keyboard users get the lit state without the tilt, which would be
         disorienting when it is not driven by their own pointer. */
      card.addEventListener('focus', light);
      card.addEventListener('blur', rest);
    });
  });
})();
