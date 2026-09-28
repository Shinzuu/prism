/* Tear a panel off into a real second window, still live and in sync.
   The sync is BroadcastChannel, which is the part worth knowing: postMessage
   to an opener breaks the moment either side reloads or the opener is closed,
   while a channel is addressed by NAME, so any window that joins it is
   connected — including one the user reloaded, and in either direction. */
(() => {
  const CH = 'prism-tear-off-demo';

  document.querySelectorAll('[data-top]').forEach((root) => {
    const val = root.querySelector('[data-top-val]');
    const rate = root.querySelector('[data-top-rate]');
    const tear = root.querySelector('[data-top-tear]');
    const note = root.querySelector('[data-top-note]');

    const chan = 'BroadcastChannel' in window ? new BroadcastChannel(CH) : null;
    let n = 0, timer = null, torn = false;

    const tick = () => {
      n = Math.max(0, n + Math.round((Math.random() - 0.45) * 40) + Number(rate.value));
      val.textContent = n.toLocaleString();
      chan?.postMessage({ type: 'value', n });
      timer = setTimeout(tick, 1000 / Math.max(1, Number(rate.value) / 6));
    };

    // Both directions: the torn-off window can drive the rate too, so this is
    // shared state rather than a broadcast to a passive mirror.
    chan?.addEventListener('message', (e) => {
      if (e.data?.type === 'rate') { rate.value = e.data.rate; }
      if (e.data?.type === 'hello') { torn = true; root.dataset.torn = ''; say(); }
      if (e.data?.type === 'bye') { torn = false; root.removeAttribute('data-torn'); say(); }
    });
    rate.addEventListener('input', () => chan?.postMessage({ type: 'rate', rate: rate.value }));

    const say = () => {
      note.textContent = !chan
        ? 'BroadcastChannel unavailable — the panel cannot sync.'
        : torn
          ? 'Torn off. Both views share one state over BroadcastChannel — change the rate in either.'
          : 'Not torn off. The button opens a real window; if the popup is blocked it will say so rather than appearing to do nothing.';
    };

    tear.addEventListener('click', () => {
      const w = window.open('', 'prism-tear-off', 'popup,width=300,height=220');
      if (!w) {
        // A blocked popup returns null. Saying so is the difference between a
        // known limitation and a button that looks broken.
        note.textContent = 'The browser blocked the popup — this preview runs in a sandboxed frame. ' +
          'Open the component on its own page and the tear-off works.';
        return;
      }
      w.document.write(
        '<!doctype html><meta charset="utf-8"><title>Live readout</title>' +
        '<style>body{margin:0;font:14px system-ui;background:#111;color:#eee;display:grid;' +
        'place-items:center;height:100vh;gap:8px}b{font-size:2.4rem;font-variant-numeric:tabular-nums}' +
        'input{width:80%}</style>' +
        '<b id=v>—</b><small>packets/s</small><input id=r type=range min=1 max=60 value=' + rate.value + '>' +
        '<script>const c=new BroadcastChannel(' + JSON.stringify(CH) + ');' +
        'c.postMessage({type:"hello"});' +
        'c.onmessage=e=>{if(e.data.type==="value")v.textContent=e.data.n.toLocaleString();' +
        'if(e.data.type==="rate")r.value=e.data.rate};' +
        'r.oninput=()=>c.postMessage({type:"rate",rate:r.value});' +
        'addEventListener("pagehide",()=>c.postMessage({type:"bye"}));<\/script>');
      w.document.close();
    });

    new IntersectionObserver((es) => {
      for (const e of es) {
        clearTimeout(timer);
        if (e.isIntersecting) tick();
      }
    }, { rootMargin: '60px' }).observe(root);

    say();
  });
})();
