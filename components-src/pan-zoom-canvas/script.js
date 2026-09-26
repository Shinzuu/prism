/* The viewport model from design tools: wheel zooms toward the cursor, space or
   middle-drag pans, pinch works, and the minimap shows where you are. The one
   thing that makes zoom feel right is keeping the point under the cursor fixed. */
(() => {
  const MIN = 0.35, MAX = 3.5;
  const W = 900, H = 500;

  document.querySelectorAll('[data-pz]').forEach((root) => {
    const vp = root.querySelector('[data-pz-viewport]');
    const world = root.querySelector('[data-pz-world]');
    const zoomOut = root.querySelector('[data-pz-zoom]');
    const eye = root.querySelector('[data-pz-eye]');
    let k = 1, tx = 0, ty = 0, panning = false, last = null, space = false;

    function apply() {
      world.style.setProperty('--k', k);
      world.style.setProperty('--tx', tx + 'px');
      world.style.setProperty('--ty', ty + 'px');
      // The dot grid belongs to the world, so it must pan and scale with it.
      vp.style.backgroundSize = (22 * k) + 'px ' + (22 * k) + 'px';
      vp.style.setProperty('--bx', tx + 'px');
      vp.style.setProperty('--by', ty + 'px');
      zoomOut.textContent = Math.round(k * 100) + '%';

      const r = root.getBoundingClientRect();
      eye.style.setProperty('--l', Math.max(0, Math.min(100, (-tx / k) / W * 100)) + '%');
      eye.style.setProperty('--t', Math.max(0, Math.min(100, (-ty / k) / H * 100)) + '%');
      eye.style.setProperty('--w', Math.min(100, (r.width / k) / W * 100) + '%');
      eye.style.setProperty('--h', Math.min(100, (r.height / k) / H * 100) + '%');
    }

    /* Zoom toward a point: convert it to world space, change the scale, then
       translate so that same world point lands back under the cursor. */
    function zoomAt(cx, cy, factor) {
      const r = root.getBoundingClientRect();
      const px = cx - r.left, py = cy - r.top;
      const wx = (px - tx) / k, wy = (py - ty) / k;
      k = Math.max(MIN, Math.min(MAX, k * factor));
      tx = px - wx * k; ty = py - wy * k;
      apply();
    }

    vp.addEventListener('wheel', (e) => {
      e.preventDefault();
      // Trackpad pinch arrives as a wheel event with ctrlKey set.
      const factor = e.ctrlKey ? 1 - e.deltaY * 0.01 : 1 - e.deltaY * 0.0016;
      zoomAt(e.clientX, e.clientY, factor);
    }, { passive: false });

    vp.addEventListener('pointerdown', (e) => {
      if (e.button !== 1 && e.button !== 0) return;
      if (e.button === 0 && !space) return;               // left-drag only pans with space held
      panning = true; last = { x: e.clientX, y: e.clientY };
      vp.setPointerCapture(e.pointerId);
      vp.dataset.grabbing = 'true';
      e.preventDefault();
    });
    vp.addEventListener('pointermove', (e) => {
      if (!panning) return;
      tx += e.clientX - last.x; ty += e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      apply();
    });
    const stop = () => { panning = false; delete vp.dataset.grabbing; };
    vp.addEventListener('pointerup', stop);
    vp.addEventListener('pointercancel', stop);

    root.addEventListener('keydown', (e) => {
      if (e.key === ' ') { space = true; e.preventDefault(); return; }
      const step = e.shiftKey ? 80 : 24;
      const r = root.getBoundingClientRect();
      const mid = [r.left + r.width / 2, r.top + r.height / 2];
      if (e.key === 'ArrowLeft') { tx += step; }
      else if (e.key === 'ArrowRight') { tx -= step; }
      else if (e.key === 'ArrowUp') { ty += step; }
      else if (e.key === 'ArrowDown') { ty -= step; }
      else if (e.key === '+' || e.key === '=') { zoomAt(...mid, 1.2); return; }
      else if (e.key === '-') { zoomAt(...mid, 1 / 1.2); return; }
      else if (e.key === '0') { fit(); return; }
      else return;
      e.preventDefault(); apply();
    });
    root.addEventListener('keyup', (e) => { if (e.key === ' ') space = false; });

    function fit() {
      const r = root.getBoundingClientRect();
      k = Math.min(r.width / W, r.height / H) * 0.92;
      tx = (r.width - W * k) / 2; ty = (r.height - H * k) / 2;
      apply();
    }
    root.querySelector('[data-pz-fit]').addEventListener('click', fit);
    addEventListener('resize', apply);
    fit();
  });
})();
