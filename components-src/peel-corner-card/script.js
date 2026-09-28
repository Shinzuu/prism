/* Registering --pc-peel is what makes the settle animate. An unregistered
   custom property is a string to the engine: it flips 0 to 1 with no
   in-between, and no error tells you why the transition did nothing. */
if (window.CSS && CSS.registerProperty) {
  try {
    CSS.registerProperty({
      name: '--pc-peel', syntax: '<number>', inherits: true, initialValue: '0',
    });
  } catch (e) { /* already registered by another instance on the page */ }
}

(() => {
  const clamp = (v) => Math.max(0, Math.min(1, v));

  document.querySelectorAll('[data-pc]').forEach((root) => {
    const card = root.querySelector('[data-pc-card]');
    const grab = root.querySelector('[data-pc-grab]');
    const SIZE = 132;   // must match --pc-size in the stylesheet

    let peel = 0, dragging = false;

    const set = (v, settle) => {
      peel = clamp(v);
      if (settle) {
        card.style.setProperty('--pc-target', peel.toFixed(3));
        card.dataset.pcSettling = '1';
      } else {
        card.removeAttribute('data-pc-settling');
        card.style.setProperty('--pc-peel', peel.toFixed(3));
      }
      grab.setAttribute('aria-expanded', peel > 0.5 ? 'true' : 'false');
    };

    grab.addEventListener('pointerdown', (e) => {
      dragging = true;
      grab.setPointerCapture(e.pointerId);
      card.removeAttribute('data-pc-settling');
      card.style.setProperty('--pc-peel', peel.toFixed(3));
      e.preventDefault();
    });

    grab.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const r = card.getBoundingClientRect();
      // Distance from the bottom-right corner along the fold's normal.
      const dx = r.right - e.clientX, dy = r.bottom - e.clientY;
      set((dx + dy) / 2 / SIZE, false);
    });

    const release = () => {
      if (!dragging) return;
      dragging = false;
      // Past halfway it commits, below it springs shut. No middle resting state.
      set(peel > 0.5 ? 1 : 0, true);
    };
    grab.addEventListener('pointerup', release);
    grab.addEventListener('pointercancel', release);

    // Keyboard: the same two end states, reachable without a pointer.
    grab.addEventListener('keydown', (e) => {
      const open = { ArrowLeft: 1, ArrowUp: 1, Enter: 1, ' ': 1 };
      const shut = { ArrowRight: 1, ArrowDown: 1, Escape: 1 };
      if (open[e.key]) { set(peel > 0.5 && e.key !== 'ArrowLeft' && e.key !== 'ArrowUp' ? 0 : 1, true); }
      else if (shut[e.key]) { set(0, true); }
      else return;
      e.preventDefault();
    });

    set(0, false);
  });
})();
