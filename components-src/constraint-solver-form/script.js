/* Four interdependent dimensions, two degrees of freedom. Mark which fields
   you are driving and the rest are solved. The useful part is the failure
   message: over-constrain it and the form names the exact field to release,
   rather than saying the input is invalid — the input is fine, the SET is. */
(() => {
  const DOF = 2;   // width and height determine ratio and area

  document.querySelectorAll('[data-csf]').forEach((form) => {
    const status = form.querySelector('[data-csf-status]');
    const fieldOf = (k) => form.querySelector('[data-csf-field="' + k + '"]');
    const inputOf = (k) => fieldOf(k).querySelector('input');
    const pinOf = (k) => form.querySelector('[data-csf-pin="' + k + '"]');
    const KEYS = ['w', 'h', 'r', 'a'];

    const driving = new Set(['w', 'h']);
    const order = ['w', 'h'];   // most recently pinned last, so we can name the oldest

    const num = (k) => parseFloat(inputOf(k).value);

    /* Solve from whichever pair is pinned. Each branch is explicit rather than
       a generic solver: with four variables there are six pairs, and naming
       them makes the unsolvable ones (ratio with area alone is two equations
       in two unknowns but has a sign ambiguity) visible instead of silent. */
    const solve = () => {
      const [p, q] = [...driving];
      const set = (k, v) => {
        if (driving.has(k)) return;
        inputOf(k).value = Number.isFinite(v) ? Number(v.toFixed(4)) : '';
      };
      const key = [p, q].sort().join('');
      const w = num('w'), h = num('h'), r = num('r'), a = num('a');

      if (key === 'hw') { set('r', w / h); set('a', (w * h) / 1e6); }
      else if (key === 'rw') { const H = w / r; set('h', H); set('a', (w * H) / 1e6); }
      else if (key === 'hr') { const W = h * r; set('w', W); set('a', (W * h) / 1e6); }
      else if (key === 'aw') { const H = (a * 1e6) / w; set('h', H); set('r', w / H); }
      else if (key === 'ah') { const W = (a * 1e6) / h; set('w', W); set('r', W / h); }
      else if (key === 'ar') { const W = Math.sqrt(a * 1e6 * r); set('w', W); set('h', W / r); }
    };

    const render = () => {
      for (const k of KEYS) {
        const on = driving.has(k);
        fieldOf(k).dataset.role = on ? 'driving' : 'derived';
        const pin = pinOf(k);
        pin.setAttribute('aria-pressed', String(on));
        pin.querySelector('.csf__pin-t').textContent = on ? 'driving' : 'derived';
        // Derived inputs stay focusable and readable; readOnly, never disabled.
        inputOf(k).readOnly = !on;
        fieldOf(k).removeAttribute('data-conflict');
      }

      if (driving.size > DOF) {
        /* Over-constrained. Name the field to release — the OLDEST pin, since
           the newest one is what the person just asked for. "Invalid" would be
           wrong: every value is fine, the combination is not. */
        const release = order[0];
        for (const k of order.slice(0, driving.size - DOF)) fieldOf(k).dataset.conflict = '';
        status.dataset.kind = 'over';
        status.textContent = 'Over-constrained by ' + (driving.size - DOF) +
          '. Release ' + fieldOf(release).querySelector('label').firstChild.textContent.trim().toLowerCase() +
          ' to solve for the rest.';
        return;
      }
      if (driving.size < DOF) {
        status.dataset.kind = 'under';
        status.textContent = 'Under-constrained. Pin ' + (DOF - driving.size) + ' more to solve.';
        return;
      }
      solve();
      status.dataset.kind = 'ok';
      status.textContent = 'Solved from ' + [...driving].map((k) =>
        fieldOf(k).querySelector('label').firstChild.textContent.trim().toLowerCase()).join(' and ') + '.';
    };

    for (const k of KEYS) {
      pinOf(k).addEventListener('click', () => {
        if (driving.has(k)) { driving.delete(k); order.splice(order.indexOf(k), 1); }
        else { driving.add(k); order.push(k); }
        render();
      });
      inputOf(k).addEventListener('input', () => { if (driving.has(k)) render(); });
    }

    form.addEventListener('submit', (e) => e.preventDefault());
    render();
  });
})();
