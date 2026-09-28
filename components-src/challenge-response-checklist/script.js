/* Challenge-and-response, as aviation runs it. Each line names a condition to
   verify and the expected reply, and is confirmed individually — never with a
   "check all" affordance, which is the mechanism by which a checklist stops
   being a check. One item HOLDS: its precondition is false, and it cannot be
   confirmed until that changes, so the list refuses to advance rather than
   letting the sequence be completed on autopilot. */
(() => {
  const ITEMS = [
    { q: 'Parking brake', a: 'SET', pre: () => true },
    { q: 'Fuel quantity', a: '12.4 t, cross-checked', pre: () => true },
    { q: 'Cabin doors', a: 'CLOSED and ARMED', pre: () => true },
    { q: 'Ground crew clear', a: 'CONFIRMED', pre: (s) => s.groundClear,
      hold: 'Ground crew has not reported clear. This item holds.' },
    { q: 'Beacon', a: 'ON', pre: () => true },
    { q: 'Pushback clearance', a: 'RECEIVED', pre: () => true },
  ];

  document.querySelectorAll('[data-crc]').forEach((root) => {
    const list = root.querySelector('[data-crc-list]');
    const meta = root.querySelector('[data-crc-meta]');
    const commit = root.querySelector('[data-crc-commit]');
    const reset = root.querySelector('[data-crc-reset]');

    const state = { groundClear: false, at: 0, done: new Set(), t: null };

    const render = () => {
      list.replaceChildren();
      ITEMS.forEach((item, i) => {
        const li = document.createElement('li');
        li.className = 'crc__item';
        const reachable = i === state.at;
        const held = reachable && !item.pre(state);
        li.dataset.state = state.done.has(i) ? 'done' : held ? 'held' : reachable ? 'now' : i < state.at ? 'done' : 'ahead';

        const chal = document.createElement('div');
        chal.className = 'crc__chal';
        chal.innerHTML = '<span class="crc__q">' + item.q + '</span><span class="crc__a">' +
          (state.done.has(i) ? '✓ ' + item.a : held ? item.hold : item.a) + '</span>';

        const btn = document.createElement('button');
        btn.type = 'button'; btn.className = 'crc__resp';
        btn.textContent = state.done.has(i) ? 'confirmed' : held ? 'holding' : 'Confirm';
        // Only the current item is operable. Items ahead are visible and inert.
        btn.disabled = !reachable || held || state.done.has(i);
        btn.addEventListener('click', () => {
          state.done.add(i); state.at = i + 1; render();
        });

        li.append(chal, btn);
        list.append(li);
      });

      const held = state.at < ITEMS.length && !ITEMS[state.at].pre(state);
      meta.textContent = state.done.size + '/' + ITEMS.length +
        (held ? ' · HOLDING' : state.done.size === ITEMS.length ? ' · complete' : '');
      commit.disabled = state.done.size !== ITEMS.length;
    };

    reset.addEventListener('click', () => {
      state.groundClear = false; state.at = 0; state.done.clear();
      clearTimeout(state.t); arm(); render();
    });
    commit.addEventListener('click', () => {
      meta.textContent = 'committed · ' + ITEMS.length + ' items verified individually';
      commit.disabled = true;
    });

    // The precondition resolves on its own, as a real one would.
    const arm = () => {
      state.t = setTimeout(() => { state.groundClear = true; render(); }, 4200);
    };

    arm();
    render();
  });
})();
