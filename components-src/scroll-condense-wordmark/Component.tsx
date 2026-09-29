import { useEffect, useRef, useState } from 'react';

const MIN_WDTH = 62, MAX_WDTH = 125;   // Archivo's designed range
const MIN_WGHT = 620, MAX_WGHT = 780;

const COPY = [
  'Scroll this panel. The wordmark narrows on the font’s width axis — the letterforms are redrawn at a narrower proportion, keeping their full height and stroke weight.',
  'Scaling it down instead would shrink the x-height and thin the strokes, so the mark would read as further away rather than as a compact version of itself.',
  'A condensed cut is a different drawing of the same typeface, not a squashed one — which is why transform: scaleX() looks wrong to anyone who has set type.',
  'The bar keeps its height; only the mark’s proportion changes, so the layout never reflows while you scroll.',
  'Keep going — the axis is clamped at its designed minimum, not at an arbitrary number.',
];

export default function ScrollCondenseWordmark() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const markRef = useRef<HTMLAnchorElement>(null);
  const [axes, setAxes] = useState({ wdth: MAX_WDTH, wght: MAX_WGHT });
  const [read, setRead] = useState('');
  const ticking = useRef(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setRead(`reduced motion — axis held at wdth ${MAX_WDTH}%`);
      return;
    }
    const apply = () => {
      ticking.current = false;
      const max = el.scrollHeight - el.clientHeight;
      const t = max > 0 ? Math.min(1, el.scrollTop / Math.min(max, 140)) : 0;
      const wdth = MAX_WDTH - (MAX_WDTH - MIN_WDTH) * t;
      const wght = MAX_WGHT - (MAX_WGHT - MIN_WGHT) * t;
      setAxes({ wdth, wght });
    };
    // rAF-throttled and passive: writing styles on every scroll event forces
    // layout far more often than the display can show.
    const onScroll = () => { if (ticking.current) return; ticking.current = true; requestAnimationFrame(apply); };
    el.addEventListener('scroll', onScroll, { passive: true });
    apply();
    return () => el.removeEventListener('scroll', onScroll);
  }, []);

  /* Measure AFTER the axes have been applied. Reading the width in the same
     pass that sets them reports the previous frame's number, which on a
     component whose whole point is the measurement is worse than no number. */
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setRead(`wdth ${axes.wdth.toFixed(0)}% · wght ${axes.wght.toFixed(0)} · mark width ${Math.round(markRef.current?.getBoundingClientRect().width ?? 0)}px`);
  }, [axes]);

  return (
    <div className="grid gap-2">
      <header className="flex min-h-12 items-baseline justify-between gap-3 rounded-t-[9px] border border-border bg-raised px-3 py-[10px]">
        <a
          ref={markRef}
          href="#"
          className="scw-mark whitespace-nowrap text-[1.6rem] leading-none text-text no-underline"
          style={{ fontVariationSettings: `'wdth' ${axes.wdth}, 'wght' ${axes.wght}` }}
        >
          Meridian
        </a>
        <nav className="flex gap-3 text-[.74rem]">
          {['Work', 'Studio', 'Contact'].map((l) => (
            <a key={l} href="#" className="text-text-dim no-underline hover:text-text">{l}</a>
          ))}
        </nav>
      </header>

      <div ref={scrollRef} tabIndex={0} role="region" aria-label="Page content below the wordmark" className="-mt-2 grid h-[170px] content-start gap-[10px] overflow-y-auto rounded-b-[9px] border border-t-0 border-border bg-bg px-[13px] py-[11px]">
        {COPY.map((c, i) => (
          <p key={i} className="m-0 max-w-[46ch] text-[.76rem] leading-relaxed text-text-dim">{c}</p>
        ))}
      </div>

      <p className="m-0 font-mono text-[.66rem] tabular-nums text-text-dim">{read}</p>
    </div>
  );
}
