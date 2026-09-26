/* Press and hold opens a wheel of actions under the pointer; release on one
   fires it. The distance your hand travels is the same for every option,
   which is the entire argument for a radial menu over a list. */
(() => {
  const HOLD = 220;      // ms before the wheel opens
  const RADIUS = 92;
  const DEAD = 26;       // inside this, releasing cancels

  document.querySelectorAll('[data-rm]').forEach((root) => {
    const anchor = root.querySelector('[data-rm-anchor]');
    const wheel = root.querySelector('[data-rm-wheel]');
    const out = root.querySelector('[data-rm-out]');
    const items = [...wheel.querySelectorAll('.rm__item')];
    let timer = 0, open = false, armed = null, origin = null;

    items.forEach((it, i) => {
      // Start at twelve o'clock and go clockwise, so the order is readable.
      const a = (i / items.length) * 360 - 90;
      it.style.setProperty('--a', a + 'deg');
    });

    function place(x, y) {
      const box = root.getBoundingClientRect();
      wheel.style.setProperty('--x', (x - box.left) + 'px');
      wheel.style.setProperty('--y', (y - box.top) + 'px');
    }

    function show(x, y) {
      place(x, y);
      origin = { x, y };
      wheel.hidden = false;
      root.dataset.open = 'true';
      anchor.setAttribute('aria-expanded', 'true');
      requestAnimationFrame(() => items.forEach((it) => it.style.setProperty('--r', RADIUS + 'px')));
      open = true;
    }

    function hide() {
      items.forEach((it) => { it.style.setProperty('--r', '0px'); it.dataset.armed = 'false'; });
      root.dataset.open = 'false';
      anchor.setAttribute('aria-expanded', 'false');
      open = false; armed = null;
      setTimeout(() => { wheel.hidden = true; }, 180);
    }

    function aim(x, y) {
      if (!open || !origin) return;
      const dx = x - origin.x, dy = y - origin.y;
      const dist = Math.hypot(dx, dy);
      if (dist < DEAD) {                       // dead zone: nothing armed
        items.forEach((it) => { it.dataset.armed = 'false'; });
        armed = null;
        return;
      }
      let ang = Math.atan2(dy, dx) * 180 / Math.PI + 90;
      if (ang < 0) ang += 360;
      const idx = Math.round(ang / (360 / items.length)) % items.length;
      items.forEach((it, i) => { it.dataset.armed = String(i === idx); });
      armed = items[idx];
    }

    function fire(item) {
      if (!item) { out.textContent = 'Cancelled'; return; }
      out.textContent = item.dataset.act + ' selected';
      root.dispatchEvent(new CustomEvent('rm:select', { detail: item.dataset.act, bubbles: true }));
    }

    anchor.addEventListener('pointerdown', (e) => {
      anchor.setPointerCapture(e.pointerId);
      timer = setTimeout(() => show(e.clientX, e.clientY), HOLD);
    });
    anchor.addEventListener('pointermove', (e) => { if (open) aim(e.clientX, e.clientY); });
    anchor.addEventListener('pointerup', () => {
      clearTimeout(timer);
      if (!open) return;
      fire(armed);
      hide();
    });
    anchor.addEventListener('pointercancel', () => { clearTimeout(timer); if (open) hide(); });

    /* Keyboard is not a translation of the gesture. Space or Enter opens the
       wheel, arrows walk it, Enter fires, Escape closes. */
    anchor.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const box = anchor.getBoundingClientRect();
      show(box.left + box.width / 2, box.bottom + 8);
      items[0].focus();
      items[0].dataset.armed = 'true';
      armed = items[0];
    });

    wheel.addEventListener('keydown', (e) => {
      const i = items.indexOf(document.activeElement);
      if (i < 0) return;
      let to = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = (i + 1) % items.length;
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = (i - 1 + items.length) % items.length;
      else if (e.key === 'Escape') { e.preventDefault(); hide(); anchor.focus(); return; }
      else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(items[i]); hide(); anchor.focus(); return; }
      if (to === null) return;
      e.preventDefault();
      items.forEach((it, n) => { it.dataset.armed = String(n === to); });
      items[to].focus();
      armed = items[to];
    });

    items.forEach((it) => it.addEventListener('click', () => { fire(it); hide(); anchor.focus(); }));
  });
})();
