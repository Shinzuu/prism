/* Slide to confirm. The gesture exists to make a destructive action deliberate,
   so the two things that matter are that a partial drag never fires and that
   the keyboard path is equally deliberate rather than a single Enter. */
(() => {
  const COMMIT = 0.92;      // fraction of the rail that counts as confirmed
  const HOLD_STEP = 6;      // percent per key repeat

  document.querySelectorAll('[data-sl]').forEach((root) => {
    const rail = root.querySelector('[data-sl-rail]');
    const grip = root.querySelector('[data-sl-grip]');
    const fill = root.querySelector('[data-sl-fill]');
    const label = root.querySelector('[data-sl-label]');
    const out = root.querySelector('[data-sl-out]');
    let pct = 0, dragging = false, done = false;

    const span = () => rail.clientWidth - grip.offsetWidth - 8;

    function set(p) {
      pct = Math.max(0, Math.min(1, p));
      grip.style.left = (4 + pct * span()) + 'px';
      fill.style.width = (pct * 100) + '%';
      grip.setAttribute('aria-valuenow', Math.round(pct * 100));
      root.dataset.armed = String(pct >= COMMIT);
    }

    function settle(to) {
      root.dataset.settling = 'true';
      set(to);
      setTimeout(() => { delete root.dataset.settling; }, 340);
    }

    function commit() {
      if (done) return;
      done = true;
      settle(1);
      label.textContent = 'Deleted';
      out.textContent = 'Airframe deleted.';
      root.dispatchEvent(new CustomEvent('sl:confirm', { bubbles: true }));
      setTimeout(() => {
        done = false; label.textContent = 'Slide to delete this airframe';
        out.textContent = ''; settle(0);
      }, 2200);
    }

    grip.addEventListener('pointerdown', (e) => {
      if (done) return;
      dragging = true;
      grip.setPointerCapture(e.pointerId);     // the drag must survive leaving the rail
    });
    grip.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const box = rail.getBoundingClientRect();
      set((e.clientX - box.left - grip.offsetWidth / 2) / span());
    });
    grip.addEventListener('pointerup', () => {
      if (!dragging) return;
      dragging = false;
      if (pct >= COMMIT) commit(); else settle(0);   // a partial drag always returns
    });
    grip.addEventListener('pointercancel', () => { dragging = false; settle(0); });

    /* Holding the arrow key is the keyboard equivalent of holding the drag:
       one press does not confirm, and releasing early springs back. */
    let held = false;
    grip.addEventListener('keydown', (e) => {
      if (done) return;
      if (e.key === 'ArrowRight') { e.preventDefault(); held = true; set(pct + HOLD_STEP / 100); if (pct >= COMMIT) commit(); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); set(pct - HOLD_STEP / 100); }
      else if (e.key === 'Home') { e.preventDefault(); settle(0); }
      else if (e.key === 'End') { e.preventDefault(); settle(1); commit(); }
      else if (e.key === 'Escape') { e.preventDefault(); settle(0); }
    });
    grip.addEventListener('keyup', (e) => {
      if (e.key === 'ArrowRight' && held && pct < COMMIT) { held = false; settle(0); }
    });

    addEventListener('resize', () => set(pct));
    set(0);
  });
})();
