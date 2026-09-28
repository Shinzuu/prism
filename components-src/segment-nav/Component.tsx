import { useCallback, useEffect, useRef, useState } from 'react';

const ITEMS = ['Plan', 'Profile', 'Section', 'Loadout'];

export default function SegmentNav() {
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [box, setBox] = useState<{ x: number; w: number } | null>(null);
  const [animate, setAnimate] = useState(false);

  /* Measurement is the whole job: the indicator has to land correctly after
     fonts arrive, after the container resizes, and after the strip is
     scrolled — offsetLeft is relative to the nav, so scrolling does not
     invalidate it, but a font swap changes every width. */
  const place = useCallback((index: number) => {
    const el = itemRefs.current[index];
    if (!el) return;
    setBox({ x: el.offsetLeft, w: el.offsetWidth });
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    place(current);
    const ro = new ResizeObserver(() => place(current));
    ro.observe(nav);
    let cancelled = false;
    document.fonts?.ready.then(() => { if (!cancelled) place(current); });
    return () => { cancelled = true; ro.disconnect(); };
  }, [current, place]);

  const select = (i: number) => {
    if (i === current) return;
    setAnimate(true);
    setCurrent(i);
  };

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const last = ITEMS.length - 1;
    let to: number | null = null;
    if (e.key === 'ArrowRight') to = i === last ? 0 : i + 1;
    else if (e.key === 'ArrowLeft') to = i === 0 ? last : i - 1;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = last;
    if (to === null) return;
    e.preventDefault();
    itemRefs.current[to]?.focus();
    select(to);
  };

  return (
    <nav
      ref={navRef}
      aria-label="View"
      className="sn relative inline-flex max-w-full gap-0.5 overflow-x-auto rounded-full border border-border bg-surface p-1"
    >
      {/* One element that moves, not a background on each item: a single
          transition rather than two crossfades, and it can overshoot. */}
      <div
        aria-hidden
        className={`sn-indicator pointer-events-none absolute left-0 top-1 h-[calc(100%-8px)] rounded-full bg-accent ${
          animate ? 'sn-animate' : ''
        }`}
        style={{
          translate: `${box?.x ?? 0}px 0`,
          width: `${box?.w ?? 0}px`,
          opacity: box ? 1 : 0,
        }}
      />
      {ITEMS.map((label, i) => (
        <button
          key={label}
          type="button"
          ref={(el) => { itemRefs.current[i] = el; }}
          aria-current={i === current ? 'page' : undefined}
          onClick={() => select(i)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={`relative z-10 cursor-pointer whitespace-nowrap rounded-full border-0 bg-transparent px-[18px] py-2 font-sans text-[.88rem] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] ${
            i === current ? 'text-accent-fg' : 'text-text-dim hover:text-text'
          }`}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
