/* Stroke width follows real stylus pressure, drawn from the COALESCED events.
   A pointermove fires once per frame, but the digitiser samples many times
   faster — getCoalescedEvents() hands back the samples the browser batched,
   which is the difference between a smooth signature and a chain of straight
   segments with visible corners at every frame boundary. */
(() => {
  document.querySelectorAll('[data-psp]').forEach((root) => {
    const canvas = root.querySelector('[data-psp-pad]');
    const meta = root.querySelector('[data-psp-meta]');
    const hint = root.querySelector('[data-psp-hint]');
    const clear = root.querySelector('[data-psp-clear]');
    const ctx = canvas.getContext('2d');

    const ink = () => getComputedStyle(root).getPropertyValue('--text').trim() || '#000';
    let drawing = false, last = null, samples = 0, frames = 0, sawPressure = false;

    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect();
      // The canvas is CSS-scaled, so pointer coordinates need the same scale.
      return { x: (e.clientX - r.left) * (canvas.width / r.width),
               y: (e.clientY - r.top) * (canvas.height / r.height) };
    };

    /* A mouse reports pressure 0.5 when down and 0 otherwise; a real stylus
       reports a continuum. Fall back to speed-based width so the component is
       not inert on the hardware most reviewers have. */
    const widthFor = (e, p, prev) => {
      if (e.pointerType === 'pen' && e.pressure > 0) {
        sawPressure = true;
        const tilt = Math.min(1, Math.hypot(e.tiltX || 0, e.tiltY || 0) / 90);
        return 0.8 + e.pressure * 7 * (1 - tilt * 0.35);
      }
      if (!prev) return 2.6;
      const d = Math.hypot(p.x - prev.x, p.y - prev.y);
      return Math.max(1, 5.2 - d * 0.16);      // faster stroke, thinner line
    };

    const stroke = (e) => {
      const p = toLocal(e);
      const w = widthFor(e, p, last);
      if (last) {
        ctx.strokeStyle = ink();
        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = w;
        ctx.beginPath();
        ctx.moveTo(last.x, last.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      }
      last = p;
      samples++;
    };

    canvas.addEventListener('pointerdown', (e) => {
      drawing = true; last = null;
      canvas.setPointerCapture(e.pointerId);
      stroke(e);
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', (e) => {
      if (!drawing) return;
      frames++;
      /* The whole reason this component exists. Without coalesced events the
         stroke is one segment per frame and corners show at every join. */
      const batch = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
      for (const s of batch.length ? batch : [e]) stroke(s);
      /* Say what the ratio MEANS. A mouse reports one sample per frame, so a
         bare "1.0×" reads as the feature doing nothing, when it is the input
         device having nothing more to give. A stylus or a 240Hz mouse shows
         several, and that is where the smoothing comes from. */
      const ratio = samples / Math.max(frames, 1);
      meta.textContent = samples + ' samples / ' + frames + ' frames · ' +
        ratio.toFixed(1) + '× per frame' +
        (ratio < 1.35 ? ' — this pointer has no extra samples to coalesce' : ' — extra samples recovered');
    });

    const end = () => { drawing = false; last = null; };
    canvas.addEventListener('pointerup', end);
    canvas.addEventListener('pointercancel', end);
    canvas.addEventListener('pointerleave', end);

    clear.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      samples = frames = 0; meta.textContent = '';
    });

    hint.textContent = 'getCoalescedEvents' in PointerEvent.prototype
      ? 'Pressure from a stylus; speed stands in for a mouse.'
      : 'Coalesced events unavailable — stroke will be coarser.';
  });
})();
