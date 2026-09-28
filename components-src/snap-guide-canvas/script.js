/* Alignment guides that snap to the edges, centres and — the part most
   implementations skip — the equal-spacing rhythm already established by the
   neighbours. The engine is about forty lines; the rest is drawing. */
(() => {
  const SNAP = 5;      // px of tolerance before a candidate is considered
  const NS = 'http://www.w3.org/2000/svg';

  document.querySelectorAll('[data-sgc]').forEach((root) => {
    const stage = root.querySelector('[data-sgc-stage]');
    const guides = root.querySelector('[data-sgc-guides]');
    const live = root.querySelector('[data-sgc-live]');
    const read = root.querySelector('[data-sgc-read]');
    const others = [...root.querySelectorAll('[data-sgc-block]')].filter((b) => b !== live);

    const px = (el, p) => parseFloat(getComputedStyle(el).getPropertyValue(p));
    const boxOf = (el) => {
      const x = px(el, '--x'), y = px(el, '--y'), w = px(el, '--w'), h = px(el, '--h');
      return { x, y, w, h, cx: x + w / 2, cy: y + h / 2, r: x + w, b: y + h };
    };

    const draw = (lines, labels) => {
      guides.replaceChildren();
      const W = stage.clientWidth, H = stage.clientHeight;
      guides.setAttribute('viewBox', `0 0 ${W} ${H}`);
      for (const l of lines) {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', l.x1); ln.setAttribute('y1', l.y1);
        ln.setAttribute('x2', l.x2); ln.setAttribute('y2', l.y2);
        if (l.gap) ln.setAttribute('class', 'sgc__g--gap');
        guides.append(ln);
      }
      for (const t of labels) {
        const el = document.createElementNS(NS, 'text');
        el.setAttribute('x', t.x); el.setAttribute('y', t.y);
        el.setAttribute('text-anchor', 'middle');
        el.textContent = t.text;
        guides.append(el);
      }
    };

    /* Returns the adjusted position plus the guides to draw. Candidates are
       collected first and the closest wins per axis, so two near-misses cannot
       both apply and drag the block somewhere neither of them asked for. */
    const resolve = (x, y) => {
      const me = { x, y, w: px(live, '--w'), h: px(live, '--h') };
      me.cx = x + me.w / 2; me.cy = y + me.h / 2; me.r = x + me.w; me.b = y + me.h;
      const boxes = others.map(boxOf);
      const lines = [], labels = [];
      let bestX = null, bestY = null;

      const tryX = (mine, target, kind) => {
        const d = target - mine;
        if (Math.abs(d) <= SNAP && (!bestX || Math.abs(d) < Math.abs(bestX.d))) bestX = { d, target, kind };
      };
      const tryY = (mine, target, kind) => {
        const d = target - mine;
        if (Math.abs(d) <= SNAP && (!bestY || Math.abs(d) < Math.abs(bestY.d))) bestY = { d, target, kind };
      };

      for (const o of boxes) {
        tryX(me.x, o.x, 'left'); tryX(me.r, o.r, 'right'); tryX(me.cx, o.cx, 'centre');
        tryX(me.x, o.r, 'edge'); tryX(me.r, o.x, 'edge');
        tryY(me.y, o.y, 'top'); tryY(me.b, o.b, 'bottom'); tryY(me.cy, o.cy, 'middle');
        tryY(me.y, o.b, 'edge'); tryY(me.b, o.y, 'edge');
      }

      /* Equal spacing. Take the gap between each adjacent pair already on the
         stage and offer the same gap to the left and right of the pair — this
         is what makes a layout feel rhythmic rather than merely aligned. */
      const row = boxes.slice().sort((a, b) => a.x - b.x);
      for (let i = 0; i < row.length - 1; i++) {
        const gap = row[i + 1].x - row[i].r;
        if (gap <= 0) continue;
        tryX(me.x, row[i + 1].r + gap, 'gap ' + Math.round(gap));
        tryX(me.r, row[i].x - gap, 'gap ' + Math.round(gap));
      }

      const nx = bestX ? x + bestX.d : x;
      const ny = bestY ? y + bestY.d : y;
      const fx = { x: nx, y: ny, w: me.w, h: me.h, cx: nx + me.w / 2, cy: ny + me.h / 2, r: nx + me.w, b: ny + me.h };

      if (bestX) {
        const v = bestX.kind === 'centre' ? fx.cx : bestX.target;
        lines.push({ x1: v, y1: 0, x2: v, y2: stage.clientHeight, gap: bestX.kind.startsWith('gap') });
        if (bestX.kind.startsWith('gap')) labels.push({ x: v, y: 11, text: bestX.kind });
      }
      if (bestY) {
        const v = bestY.kind === 'middle' ? fx.cy : bestY.target;
        lines.push({ x1: 0, y1: v, x2: stage.clientWidth, y2: v, gap: false });
      }

      return { x: nx, y: ny, lines, labels,
        said: [bestX && bestX.kind, bestY && bestY.kind].filter(Boolean).join(' · ') };
    };

    const place = (x, y) => {
      const W = stage.clientWidth, H = stage.clientHeight;
      const w = px(live, '--w'), h = px(live, '--h');
      x = Math.max(0, Math.min(W - w, x));
      y = Math.max(0, Math.min(H - h, y));
      const r = resolve(x, y);
      live.style.setProperty('--x', r.x + 'px');
      live.style.setProperty('--y', r.y + 'px');
      draw(r.lines, r.labels);
      read.textContent = r.said || Math.round(r.x) + ', ' + Math.round(r.y);
    };

    let grab = null;
    live.addEventListener('pointerdown', (e) => {
      const b = boxOf(live), s = stage.getBoundingClientRect();
      grab = { dx: e.clientX - s.left - b.x, dy: e.clientY - s.top - b.y };
      live.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    live.addEventListener('pointermove', (e) => {
      if (!grab) return;
      const s = stage.getBoundingClientRect();
      place(e.clientX - s.left - grab.dx, e.clientY - s.top - grab.dy);
    });
    const drop = () => { if (grab) { grab = null; draw([], []); } };
    live.addEventListener('pointerup', drop);
    live.addEventListener('pointercancel', drop);

    // Keyboard nudging, with the same snapping applied.
    live.addEventListener('keydown', (e) => {
      const step = e.shiftKey ? 10 : 1;
      const b = boxOf(live);
      const map = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
      if (!map[e.key]) return;
      e.preventDefault();
      place(b.x + map[e.key][0], b.y + map[e.key][1]);
    });
  });
})();
