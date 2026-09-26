/* Queue position, not a spinner. Shows where you are, how fast the line is
   actually moving, and an estimate derived from that rate — and says it does
   not know when the rate is too unstable to predict from. */
(() => {
  const WINDOW = 5;            // samples kept for the rate
  const TICK = 1400;

  document.querySelectorAll('[data-qp]').forEach((root) => {
    const place = root.querySelector('[data-qp-place]');
    const rateEl = root.querySelector('[data-qp-rate]');
    const fill = root.querySelector('[data-qp-fill]');
    const you = root.querySelector('[data-qp-you]');
    const track = root.querySelector('[data-qp-track]');
    const eta = root.querySelector('[data-qp-eta]');
    const sr = root.querySelector('[data-qp-sr]');

    const START = 48;
    let pos = START;
    const samples = [];
    let lastAnnounced = null;

    function rate() {
      if (samples.length < 2) return null;
      const first = samples[0], last = samples[samples.length - 1];
      const moved = first.pos - last.pos;
      const secs = (last.t - first.t) / 1000;
      if (moved <= 0 || secs <= 0) return null;
      return moved / secs;                       // places per second
    }

    function spread() {
      // If consecutive gaps disagree wildly, an estimate would be a guess.
      if (samples.length < 4) return Infinity;
      const gaps = [];
      for (let i = 1; i < samples.length; i++) {
        const d = samples[i - 1].pos - samples[i].pos;
        if (d > 0) gaps.push((samples[i].t - samples[i - 1].t) / d);
      }
      if (gaps.length < 2) return Infinity;
      const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const varr = gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length;
      return Math.sqrt(varr) / mean;             // coefficient of variation
    }

    function human(secs) {
      if (secs < 60) return Math.round(secs) + ' seconds';
      const m = Math.round(secs / 60);
      if (m < 60) return m + (m === 1 ? ' minute' : ' minutes');
      const h = Math.round(m / 10) / 6;
      return h + (h === 1 ? ' hour' : ' hours');
    }

    function paint() {
      const done = Math.max(0, Math.min(1, (START - pos) / START));
      place.textContent = pos > 0 ? '#' + pos : 'next';
      fill.style.width = (done * 100).toFixed(1) + '%';
      you.style.left = (done * 100).toFixed(1) + '%';
      track.setAttribute('aria-valuenow', Math.round(done * 100));

      const r = rate();
      rateEl.textContent = r ? (r * 60).toFixed(1) + ' / min' : '';

      if (pos <= 0) {
        eta.textContent = 'Ready.';
        eta.removeAttribute('data-unknown');
      } else if (!r || spread() > 0.55) {
        // Honest about not knowing, rather than showing a number that will move.
        eta.textContent = 'The line is moving unevenly. No reliable estimate yet.';
        eta.dataset.unknown = 'true';
      } else {
        eta.innerHTML = 'About <b>' + human(pos / r) + '</b> left at the current rate.';
        eta.removeAttribute('data-unknown');
      }

      // Announce at milestones, not on every tick.
      const milestone = pos === 0 ? 'next' : pos <= 5 ? '5' : pos <= 10 ? '10' : pos <= 25 ? '25' : null;
      if (milestone && milestone !== lastAnnounced) {
        lastAnnounced = milestone;
        sr.textContent = pos === 0 ? 'You are next.' : 'Position ' + pos + ' in line.';
      }
    }

    function step() {
      if (pos <= 0) return;
      const move = Math.random() < 0.22 ? 0 : Math.ceil(Math.random() * 3);
      pos = Math.max(0, pos - move);
      samples.push({ pos, t: performance.now() });
      if (samples.length > WINDOW) samples.shift();
      paint();
      if (pos > 0) setTimeout(step, TICK + Math.random() * 900);
    }

    samples.push({ pos, t: performance.now() });
    paint();
    setTimeout(step, TICK);
  });
})();
