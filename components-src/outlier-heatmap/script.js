/* Charts show you THAT the p99 is bad. This answers why: drag a box around the
   slow blob and it ranks which dimension values are over-represented inside it.
   The ranking is lift — rate inside divided by rate outside — not raw count,
   because raw count just re-ranks whatever is most common overall. */
(() => {
  const DIMS = {
    region: ['us-east', 'us-west', 'eu-central', 'ap-south'],
    tier: ['free', 'pro', 'enterprise'],
    client: ['web', 'ios', 'android', 'cli'],
    cache: ['hit', 'miss'],
  };

  // Deterministic, so the demo tells the same story every load.
  let seed = 20260928;
  const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
  const pick = (a) => a[Math.floor(rnd() * a.length)];

  document.querySelectorAll('[data-oh]').forEach((root) => {
    const canvas = root.querySelector('[data-oh-canvas]');
    const plot = root.querySelector('[data-oh-plot]');
    const sel = root.querySelector('[data-oh-sel]');
    const ranks = root.querySelector('[data-oh-ranks]');
    const read = root.querySelector('[data-oh-read]');
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;

    // The planted truth: ap-south on a cache miss is slow. Nothing says so.
    const pts = Array.from({ length: 1400 }, () => {
      const r = { region: pick(DIMS.region), tier: pick(DIMS.tier), client: pick(DIMS.client), cache: pick(DIMS.cache) };
      const slow = r.region === 'ap-south' && r.cache === 'miss' && rnd() < 0.72;
      r.size = 20 + rnd() * 900;
      r.ms = slow ? 420 + rnd() * 380 : 40 + rnd() * 150 + r.size * 0.06;
      return r;
    });

    const maxMs = 820, maxSize = 940;
    const px = (p) => 8 + (p.size / maxSize) * (W - 16);
    const py = (p) => H - 8 - (Math.min(p.ms, maxMs) / maxMs) * (H - 16);

    const style = getComputedStyle(root);
    const draw = (inside) => {
      const dim = style.getPropertyValue('--text-dim').trim() || '#888';
      const acc = style.getPropertyValue('--accent').trim() || '#c00';
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < pts.length; i++) {
        const hit = inside && inside.has(i);
        ctx.fillStyle = hit ? acc : dim;
        ctx.globalAlpha = hit ? 0.9 : (inside ? 0.16 : 0.34);
        ctx.beginPath();
        ctx.arc(px(pts[i]), py(pts[i]), hit ? 2.4 : 1.8, 0, 6.2832);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const rank = (inside) => {
      if (inside.size < 12) {
        ranks.innerHTML = '<li><p class="oh__empty">Too few points selected to rank anything honestly.</p></li>';
        return;
      }
      const rows = [];
      for (const [dim, values] of Object.entries(DIMS)) {
        for (const value of values) {
          let insideHits = 0, outsideHits = 0;
          for (let i = 0; i < pts.length; i++) {
            if (pts[i][dim] !== value) continue;
            if (inside.has(i)) insideHits++; else outsideHits++;
          }
          const rIn = insideHits / inside.size;
          const rOut = outsideHits / (pts.length - inside.size);
          // Guard the zero denominator: a value absent outside the box would
          // otherwise rank as infinitely significant off one stray point.
          if (rIn < 0.08) continue;
          rows.push({ key: dim + ' = ' + value, lift: rIn / Math.max(rOut, 1 / pts.length), share: rIn });
        }
      }
      rows.sort((a, b) => b.lift - a.lift);
      const top = rows.slice(0, 4);
      const cap = Math.max(...top.map((r) => r.lift), 2);
      ranks.innerHTML = top.map((r) => (
        '<li class="oh__rank"><span class="oh__rank-k">' + r.key + '</span>' +
        '<span class="oh__rank-bar"><i style="width:' + Math.round((r.lift / cap) * 100) + '%"></i></span>' +
        '<span class="oh__rank-v">' + r.lift.toFixed(1) + '×</span></li>'
      )).join('');
    };

    let start = null;
    const local = (e) => {
      const r = plot.getBoundingClientRect();
      return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H, r };
    };

    plot.addEventListener('pointerdown', (e) => {
      start = local(e);
      plot.setPointerCapture(e.pointerId);
      sel.hidden = false;
      e.preventDefault();
    });

    plot.addEventListener('pointermove', (e) => {
      if (!start) return;
      const p = local(e);
      const x0 = Math.min(start.x, p.x), x1 = Math.max(start.x, p.x);
      const y0 = Math.min(start.y, p.y), y1 = Math.max(start.y, p.y);
      const k = p.r.width / W;
      sel.style.cssText = 'left:' + x0 * k + 'px;top:' + y0 * k + 'px;width:' +
        (x1 - x0) * k + 'px;height:' + (y1 - y0) * k + 'px';

      const inside = new Set();
      for (let i = 0; i < pts.length; i++) {
        const x = px(pts[i]), y = py(pts[i]);
        if (x >= x0 && x <= x1 && y >= y0 && y <= y1) inside.add(i);
      }
      draw(inside);
      rank(inside);
      read.textContent = inside.size + ' of ' + pts.length + ' selected';
    });

    const end = () => { start = null; };
    plot.addEventListener('pointerup', end);
    plot.addEventListener('pointercancel', end);

    // Keyboard equivalent: select the slowest decile, the usual question.
    plot.tabIndex = 0;
    plot.setAttribute('role', 'application');
    plot.setAttribute('aria-label', 'Latency scatter. Press Enter to select the slowest tenth of requests.');
    plot.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      const cut = [...pts].sort((a, b) => b.ms - a.ms)[Math.floor(pts.length * 0.1)].ms;
      const inside = new Set();
      pts.forEach((p, i) => { if (p.ms >= cut) inside.add(i); });
      sel.hidden = true;
      draw(inside); rank(inside);
      read.textContent = inside.size + ' slowest requests selected';
    });

    draw(null);
  });
})();
