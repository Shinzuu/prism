/* After an action completes, its parameters stay adjustable. Change one and
   the action silently re-runs — from the state BEFORE it, never on top of the
   result. That distinction is the whole component: re-applying to the current
   output compounds the effect and there is no way back to the original. */
(() => {
  document.querySelectorAll('[data-ala]').forEach((root) => {
    const shape = root.querySelector('[data-ala-shape]');
    const btn = root.querySelector('[data-ala-do]');
    const panel = root.querySelector('[data-ala-panel]');
    const state = root.querySelector('[data-ala-state]');
    const runs = root.querySelector('[data-ala-runs]');

    // The snapshot the action re-runs FROM. Taken once, when the action is
    // first applied, and never updated by a re-run.
    let before = null;
    let count = 0;

    const params = () => {
      const p = {};
      for (const el of panel.querySelectorAll('[data-ala-p]')) p[el.dataset.alaP] = Number(el.value);
      return p;
    };

    const readState = () => ({
      radius: parseFloat(shape.style.getPropertyValue('--ala-r')) || 0,
      spread: parseFloat(shape.style.getPropertyValue('--ala-s')) || 0,
    });

    const paint = (s) => {
      shape.style.setProperty('--ala-r', s.radius + 'px');
      shape.style.setProperty('--ala-s', s.spread + 'px');
    };

    // Pure: base state in, new state out. No reading of the live DOM.
    const applyBlur = (base, p) => ({
      radius: base.radius + p.radius,
      spread: base.spread + p.spread,
    });

    const run = (isRerun) => {
      const p = params();
      paint(applyBlur(before, p));
      count++;
      for (const el of panel.querySelectorAll('[data-ala-p]')) {
        panel.querySelector('[data-ala-o="' + el.dataset.alaP + '"]').value = el.value;
      }
      runs.textContent = 'applied from the pre-action snapshot · run ' + count +
        (isRerun ? ' (re-run, not stacked)' : '');
      state.textContent = 'blur r' + p.radius + ' s' + p.spread;
    };

    btn.addEventListener('click', () => {
      before = readState();     // snapshot taken once, before the first apply
      count = 0;
      panel.hidden = false;
      run(false);
    });

    for (const el of panel.querySelectorAll('[data-ala-p]')) {
      el.addEventListener('input', () => run(true));
    }

    /* Committing anything else would invalidate the snapshot, so a real editor
       closes this panel on the next unrelated action. Clicking the canvas
       stands in for that here. */
    root.querySelector('[data-ala-canvas]').addEventListener('click', () => {
      if (panel.hidden) return;
      panel.hidden = true;
      before = null;
      state.textContent = 'committed — no longer adjustable';
    });
  });
})();
