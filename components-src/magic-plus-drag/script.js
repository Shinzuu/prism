/* The plus is torn off and dropped between two rows, and the item is created
   exactly there. The usual alternative — append, then drag it into place — is
   two gestures for one intention, and the first one puts the item somewhere
   nobody wanted. */
(() => {
  document.querySelectorAll('[data-mpd]').forEach((root) => {
    const list = root.querySelector('[data-mpd-list]');
    const plus = root.querySelector('[data-mpd-plus]');
    const read = root.querySelector('[data-mpd-read]');

    const slot = document.createElement('li');
    slot.className = 'mpd__slot';
    slot.setAttribute('aria-hidden', 'true');

    const items = () => [...list.querySelectorAll('.mpd__item')];

    /* Index of the gap nearest a y coordinate. Comparing against each row's
       MIDPOINT is what makes this feel right: the boundary flips when the
       pointer passes the middle of a row, not when it crosses the edge. */
    const gapAt = (y) => {
      const rows = items();
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i].getBoundingClientRect();
        if (y < r.top + r.height / 2) return i;
      }
      return rows.length;
    };

    const showSlot = (i) => {
      const rows = items();
      if (i >= rows.length) list.append(slot); else list.insertBefore(slot, rows[i]);
      slot.dataset.open = '';
      read.textContent = 'Insert at position ' + (i + 1);
    };

    const hideSlot = () => { slot.removeAttribute('data-open'); slot.remove(); };

    const insertAt = (i) => {
      const li = document.createElement('li');
      li.className = 'mpd__item mpd__item--new';
      const input = document.createElement('input');
      input.type = 'text';
      input.setAttribute('aria-label', 'New step name');
      input.placeholder = 'New step';
      li.append(input);
      const rows = items();
      if (i >= rows.length) list.append(li); else list.insertBefore(li, rows[i]);
      input.focus();
      read.textContent = 'Inserted at position ' + (i + 1);

      const commit = () => {
        const v = input.value.trim();
        if (!v) { li.remove(); read.textContent = 'Cancelled.'; return; }
        li.classList.remove('mpd__item--new');
        li.textContent = v;
      };
      input.addEventListener('blur', commit);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
        if (e.key === 'Escape') { input.value = ''; input.blur(); }
      });
    };

    let drag = null;
    plus.addEventListener('pointerdown', (e) => {
      const r = plus.getBoundingClientRect();
      drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
      plus.setPointerCapture(e.pointerId);
      plus.dataset.dragging = '';
      plus.style.left = r.left + 'px';
      plus.style.top = r.top + 'px';
      e.preventDefault();
    });

    plus.addEventListener('pointermove', (e) => {
      if (!drag) return;
      plus.style.left = (e.clientX - drag.dx) + 'px';
      plus.style.top = (e.clientY - drag.dy) + 'px';
      const b = list.getBoundingClientRect();
      // Only open a slot while over the list, so a stray drag cancels cleanly.
      if (e.clientY > b.top - 24 && e.clientY < b.bottom + 24) showSlot(gapAt(e.clientY));
      else hideSlot();
    });

    const end = () => {
      if (!drag) return;
      drag = null;
      const open = slot.isConnected && slot.hasAttribute('data-open');
      const i = open ? [...list.children].filter((n) => n.classList.contains('mpd__item') ||
        n === slot).indexOf(slot) : -1;
      hideSlot();
      plus.removeAttribute('data-dragging');
      plus.style.left = plus.style.top = '';
      if (i >= 0) insertAt(i); else read.textContent = 'Drag the plus between two steps.';
    };
    plus.addEventListener('pointerup', end);
    plus.addEventListener('pointercancel', end);

    /* Keyboard path: the drag is a pointer idiom, so the same intention needs a
       key equivalent — Enter arms it, arrows choose the gap, Enter confirms. */
    let armed = -1;
    plus.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (armed < 0) { armed = items().length; showSlot(armed); }
        else { const i = armed; armed = -1; hideSlot(); insertAt(i); }
        return;
      }
      if (armed < 0) return;
      if (e.key === 'ArrowUp') { armed = Math.max(0, armed - 1); showSlot(armed); e.preventDefault(); }
      if (e.key === 'ArrowDown') { armed = Math.min(items().length, armed + 1); showSlot(armed); e.preventDefault(); }
      if (e.key === 'Escape') { armed = -1; hideSlot(); read.textContent = 'Cancelled.'; }
    });
  });
})();
