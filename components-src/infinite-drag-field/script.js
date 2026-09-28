/* Drag the label and the number climbs forever.
   The constraint that shapes this: a pointer runs out of screen. Pointer Lock
   solves it properly — the cursor is hidden and removed from the desktop, and
   the browser reports movementX indefinitely, so the drag has no edge at all.
   Where lock is unavailable the code falls back to accumulating deltas, which
   still works but stops at the screen edge. */
(() => {
  document.querySelectorAll('[data-idf]').forEach((root) => {
    const scrub = root.querySelector('[data-idf-scrub]');
    const input = root.querySelector('[data-idf-in]');
    const read = root.querySelector('[data-idf-read]');

    const canLock = 'requestPointerLock' in Element.prototype;
    let dragging = false, acc = 0, locked = false;

    const setValue = (v) => {
      input.value = String(Math.round(v));
      scrub.setAttribute('aria-valuenow', input.value);
    };

    const apply = (dx, e) => {
      /* Modifiers change the gearing, which is what makes a scrub usable for
         both coarse and fine work — the alternative is a slider you have to
         re-scale whenever the useful range changes. */
      const gear = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      acc += dx * gear;
      const step = Math.trunc(acc);
      if (!step) return;
      acc -= step;
      setValue(Number(input.value) + step);
      read.textContent = 'movementX ' + (dx > 0 ? '+' : '') + dx +
        ' · gear ×' + gear + (locked ? ' · pointer locked' : ' · fallback, edge-limited');
    };

    scrub.addEventListener('pointerdown', async (e) => {
      dragging = true; acc = 0;
      root.dataset.scrubbing = '';
      scrub.setPointerCapture(e.pointerId);
      e.preventDefault();
      if (canLock) {
        try {
          // Chrome resolves a promise; older engines return undefined.
          await scrub.requestPointerLock({ unadjustedMovement: true });
          locked = document.pointerLockElement === scrub;
        } catch { locked = false; }
      }
      read.textContent = locked ? 'pointer locked — no screen edge' : 'fallback — limited by screen width';
    });

    document.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      // movementX is the only delta that keeps reporting once the cursor is
      // locked; clientX freezes because the cursor no longer moves.
      apply(e.movementX || 0, e);
    });

    const end = () => {
      if (!dragging) return;
      dragging = false;
      root.removeAttribute('data-scrubbing');
      if (locked && document.exitPointerLock) document.exitPointerLock();
      locked = false;
    };
    document.addEventListener('pointerup', end);
    document.addEventListener('pointercancel', end);
    document.addEventListener('pointerlockchange', () => {
      if (!document.pointerLockElement) locked = false;
    });

    // A drag is a pointer gesture; the same value needs a key path.
    scrub.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : e.altKey ? 0.1 : 1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') setValue(Number(input.value) + step);
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') setValue(Number(input.value) - step);
      else if (e.key === 'Home') setValue(0);
      else return;
      e.preventDefault();
      read.textContent = 'keyboard · step ' + step;
    });

    input.addEventListener('input', () => scrub.setAttribute('aria-valuenow', input.value || '0'));
    read.textContent = canLock ? 'Pointer Lock available' : 'Pointer Lock unavailable — edge-limited fallback';
  });
})();
