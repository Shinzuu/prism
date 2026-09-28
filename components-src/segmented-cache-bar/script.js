/* Parallel work does not finish in order, and a single-width progress bar
   cannot say so — it can only move forward, so it either jumps or lies.
   One element per unit of work reports what actually happened: which shards
   are done, which are in flight, and which came back a miss. */
(() => {
  const SHARDS = 16, WORKERS = 4;

  document.querySelectorAll('[data-scb]').forEach((root) => {
    const bar = root.querySelector('[data-scb-bar]');
    const lanes = root.querySelector('[data-scb-lanes]');
    const doneOut = root.querySelector('[data-scb-done]');
    const totalOut = root.querySelector('[data-scb-total]');
    const elOut = root.querySelector('[data-scb-el]');
    totalOut.textContent = SHARDS;

    let segs = [], timers = [], t0 = 0, done = 0, raf = 0;

    const build = () => {
      bar.replaceChildren();
      lanes.replaceChildren();
      segs = Array.from({ length: SHARDS }, (_, i) => {
        const d = document.createElement('div');
        d.className = 'scb__seg';
        d.dataset.state = 'idle';
        d.title = 'shard ' + i;
        bar.append(d);
        return d;
      });
      for (let w = 0; w < WORKERS; w++) {
        const li = document.createElement('li');
        li.className = 'scb__lane';
        li.innerHTML = '<span class="scb__lane-k">worker ' + w + '</span><span class="scb__lane-v">idle</span>';
        lanes.append(li);
      }
    };

    const setLane = (w, text) => {
      lanes.children[w].lastElementChild.textContent = text;
    };

    const tick = () => {
      elOut.textContent = ((performance.now() - t0) / 1000).toFixed(1) + 's';
      raf = requestAnimationFrame(tick);
    };

    const start = () => {
      timers.forEach(clearTimeout);
      timers = []; done = 0; t0 = performance.now();
      build();
      cancelAnimationFrame(raf); tick();

      // A shared queue: each worker takes the next shard when it frees up, so
      // completion order depends on shard cost, exactly like the real thing.
      let next = 0;
      const pump = (w) => {
        if (next >= SHARDS) { setLane(w, 'drained'); return; }
        const i = next++;
        const seg = segs[i];
        seg.dataset.state = 'run';
        setLane(w, 'shard ' + i);
        const cost = 180 + Math.random() * 900;
        timers.push(setTimeout(() => {
          seg.dataset.state = Math.random() < 0.18 ? 'miss' : 'done';
          seg.title = 'shard ' + i + ' — ' + seg.dataset.state;
          done++;
          doneOut.textContent = done;
          bar.setAttribute('aria-valuenow', Math.round((done / SHARDS) * 100));
          if (done === SHARDS) {
            cancelAnimationFrame(raf);
            setLane(w, 'drained');
            timers.push(setTimeout(start, 2200));
            return;
          }
          pump(w);
        }, cost));
      };
      for (let w = 0; w < WORKERS; w++) pump(w);
    };

    // Do not run the simulation off-screen; it is a demo, not a real job.
    new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) start();
        else { timers.forEach(clearTimeout); cancelAnimationFrame(raf); }
      }
    }, { rootMargin: '80px' }).observe(root);

    build();
  });
})();
