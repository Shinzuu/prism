/* Switch scanning: the entire menu operated by ONE input.
   A light walks the groups on a timer; the switch drops into the highlighted
   group, the light then walks its items, and the switch selects. This is how
   someone with a single reliable movement uses software, and the thing that
   makes it usable or not is whether they can see how long they have left. */
(() => {
  const CIRC = 2 * Math.PI * 15;

  document.querySelectorAll('[data-ssm]').forEach((root) => {
    const stage = root.querySelector('[data-ssm-stage]');
    const groups = [...root.querySelectorAll('[data-ssm-group]')];
    const meta = root.querySelector('[data-ssm-meta]');
    const arc = root.querySelector('[data-ssm-arc]');
    const keyBtn = root.querySelector('[data-ssm-key]');
    const dwell = root.querySelector('[data-ssm-dwell]');
    const dwellOut = root.querySelector('[data-ssm-dwellv]');

    let level = 'group';   // 'group' | 'item'
    let gi = 0, ii = 0, inside = null;
    let t0 = 0, raf = 0, timer = null;

    const itemsOf = (g) => [...g.querySelectorAll('li')];

    const paint = () => {
      groups.forEach((g, i) => {
        const on = level === 'group' && i === gi;
        if (on) g.dataset.scan = ''; else g.removeAttribute('data-scan');
        if (g === inside) g.dataset.inside = ''; else g.removeAttribute('data-inside');
        itemsOf(g).forEach((li, j) => {
          const lit = level === 'item' && g === inside && j === ii;
          if (lit) li.dataset.scan = ''; else li.removeAttribute('data-scan');
        });
      });
      meta.textContent = level === 'group'
        ? 'scanning groups · ' + groups[gi].dataset.ssmGroup
        : 'inside ' + inside.dataset.ssmGroup + ' · ' + itemsOf(inside)[ii].textContent;
    };

    /* The countdown ring. Without it the interface is a guessing game: the
       user cannot tell whether they have half a second or two, so they either
       press early and land on the wrong thing or wait and miss the window. */
    const tick = () => {
      const span = Number(dwell.value);
      const left = Math.max(0, 1 - (performance.now() - t0) / span);
      arc.style.strokeDashoffset = String(CIRC * (1 - left));
      raf = requestAnimationFrame(tick);
    };

    const advance = () => {
      if (level === 'group') gi = (gi + 1) % groups.length;
      else ii = (ii + 1) % itemsOf(inside).length;
      paint();
      schedule();
    };

    const schedule = () => {
      clearTimeout(timer); cancelAnimationFrame(raf);
      t0 = performance.now();
      tick();
      timer = setTimeout(advance, Number(dwell.value));
    };

    const press = () => {
      if (level === 'group') {
        inside = groups[gi];
        level = 'item'; ii = 0;
      } else {
        const li = itemsOf(inside)[ii];
        li.dataset.picked = '';
        setTimeout(() => li.removeAttribute('data-picked'), 900);
        meta.textContent = 'selected ' + li.textContent + ' from ' + inside.dataset.ssmGroup;
        level = 'group'; inside = null;
      }
      paint();
      schedule();
    };

    const back = () => {
      if (level !== 'item') return;
      level = 'group'; inside = null; paint(); schedule();
    };

    stage.addEventListener('keydown', (e) => {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); press(); }
      else if (e.key === 'Escape') { e.preventDefault(); back(); }
    });
    keyBtn.addEventListener('click', press);
    dwell.addEventListener('input', () => { dwellOut.value = dwell.value + 'ms'; schedule(); });

    const stop = () => { clearTimeout(timer); cancelAnimationFrame(raf); };
    // Never scan off-screen: a timer nobody can see is just battery.
    new IntersectionObserver((es) => {
      for (const e of es) { if (e.isIntersecting) { paint(); schedule(); } else stop(); }
    }, { rootMargin: '60px' }).observe(root);

    dwellOut.value = dwell.value + 'ms';
    paint();
  });
})();
