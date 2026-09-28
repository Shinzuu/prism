import { useEffect, useRef, useState } from 'react';

const CH = 'prism-tear-off-demo';

export default function TearOffPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const chan = useRef<BroadcastChannel | null>(null);
  const [n, setN] = useState(0);
  const [rate, setRate] = useState(24);
  const [torn, setTorn] = useState(false);
  const [note, setNote] = useState('');
  const rateRef = useRef(24);
  rateRef.current = rate;

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') { setNote('BroadcastChannel unavailable — the panel cannot sync.'); return; }
    const c = new BroadcastChannel(CH);
    chan.current = c;
    /* Both directions: the torn-off window drives the rate too, so this is
       shared state rather than a broadcast to a passive mirror. A channel is
       addressed by NAME, so any window that joins is connected — including one
       the user reloaded, which an opener reference cannot survive. */
    c.onmessage = (e) => {
      if (e.data?.type === 'rate') setRate(e.data.rate);
      if (e.data?.type === 'hello') setTorn(true);
      if (e.data?.type === 'bye') setTorn(false);
    };
    return () => c.close();
  }, []);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      setN((v) => {
        const next = Math.max(0, v + Math.round((Math.random() - 0.45) * 40) + rateRef.current);
        chan.current?.postMessage({ type: 'value', n: next });
        return next;
      });
      timer = setTimeout(tick, 1000 / Math.max(1, rateRef.current / 6));
    };
    const io = new IntersectionObserver((es) => {
      for (const e of es) { clearTimeout(timer); if (e.isIntersecting) tick(); }
    }, { rootMargin: '60px' });
    io.observe(el);
    return () => { clearTimeout(timer); io.disconnect(); };
  }, []);

  useEffect(() => {
    setNote(!chan.current
      ? 'BroadcastChannel unavailable — the panel cannot sync.'
      : torn
        ? 'Torn off. Both views share one state over BroadcastChannel — change the rate in either.'
        : 'Not torn off. The button opens a real window; if the popup is blocked it will say so rather than appearing to do nothing.');
  }, [torn]);

  const tear = () => {
    const w = window.open('', 'prism-tear-off', 'popup,width=300,height=220');
    // A blocked popup returns null and raises NOTHING, so a button that ignores
    // the return value looks broken rather than blocked.
    if (!w) {
      setNote('The browser blocked the popup — this preview runs in a sandboxed frame. Open the component on its own page and the tear-off works.');
      return;
    }
    /* The torn-off document has no access to this page's stylesheet, so the
       palette is resolved here and passed through as concrete values. That
       keeps the second window on the same theme and keeps literal colours out
       of the source, which the build gate rejects for good reason. */
    const cs = getComputedStyle(rootRef.current ?? document.body);
    const tok = (n: string, fallback: string) => cs.getPropertyValue(n).trim() || fallback;
    const bg = tok('--bg', cs.backgroundColor);
    const fg = tok('--text', cs.color);
    const accent = tok('--accent', cs.color);

    w.document.write(
      '<!doctype html><meta charset="utf-8"><title>Live readout</title>' +
      '<style>body{margin:0;font:14px system-ui;background:' + bg + ';color:' + fg + ';display:grid;place-items:center;height:100vh;gap:8px}' +
      'b{font-size:2.4rem;font-variant-numeric:tabular-nums;color:' + accent + '}input{width:80%}</style>' +
      '<b id=v>—</b><small>packets/s</small><input id=r type=range min=1 max=60 value=' + rate + '>' +
      '<script>const c=new BroadcastChannel(' + JSON.stringify(CH) + ');c.postMessage({type:"hello"});' +
      'c.onmessage=e=>{if(e.data.type==="value")v.textContent=e.data.n.toLocaleString();' +
      'if(e.data.type==="rate")r.value=e.data.rate};' +
      'r.oninput=()=>c.postMessage({type:"rate",rate:r.value});' +
      'addEventListener("pagehide",()=>c.postMessage({type:"bye"}));<\/script>'
    );
    w.document.close();
  };

  return (
    <div ref={rootRef} className="grid gap-2">
      <div className="overflow-hidden rounded-[10px] border border-border bg-bg">
        <div className="flex items-center justify-between gap-[10px] border-b border-border bg-raised px-[11px] py-2">
          <p className="m-0 text-[.78rem] font-medium">Live readout</p>
          <button
            type="button" onClick={tear}
            className={`cursor-pointer rounded-md border bg-bg px-[9px] py-1 font-sans text-[.68rem] focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              torn ? 'border-accent text-accent' : 'border-border text-text'
            }`}
          >
            Tear off ↗
          </button>
        </div>
        <div className={`grid gap-1.5 p-3 ${torn ? 'opacity-40' : ''}`}>
          <p className="m-0 font-mono text-[1.9rem] leading-none tabular-nums text-accent">{n.toLocaleString()}</p>
          <p className="m-0 text-[.68rem] text-text-dim">packets/s · shared state, not a copy</p>
          <label className="mt-1 grid grid-cols-[2.6rem_1fr] items-center gap-2 text-[.7rem] text-text-dim">
            Rate
            <input
              type="range" min={1} max={60} value={rate}
              onChange={(e) => { const v = Number(e.target.value); setRate(v); chan.current?.postMessage({ type: 'rate', rate: v }); }}
              className="min-w-0 accent-accent"
            />
          </label>
        </div>
      </div>
      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{note}</p>
    </div>
  );
}
