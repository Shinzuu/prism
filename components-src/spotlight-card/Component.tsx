import { useEffect, useRef } from 'react';

const MAX_TILT = 6; // degrees; past about 8 it reads as a gimmick

const CARDS = [
  { kicker: 'Airframe 04', title: 'Delta canard',
    text: 'Close-coupled canards ahead of a delta wing, trading trim drag for vortex lift at high angle of attack.',
    spec: [['ceiling', '19 800 m'], ['thrust', '2 × 90 kN']] as const },
  { kicker: 'Airframe 07', title: 'Variable geometry',
    text: 'Wings sweep from 20 to 68 degrees, buying field performance at low sweep and supersonic reach at high.',
    spec: [['sweep', '20–68°'], ['crew', '2']] as const },
];

function SpotlightCard({ card }: { card: (typeof CARDS)[number] }) {
  const ref = useRef<HTMLElement>(null);

  /* Pointer position is written as custom properties so every visual decision
     stays in CSS, and each frame is scheduled on rAF so a fast pointer cannot
     flood layout with writes the screen will never show. */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let frame = 0;
    let pending: { x: number; y: number; w: number; h: number } | null = null;

    const paint = () => {
      frame = 0;
      if (!pending) return;
      const { x, y, w, h } = pending;
      el.style.setProperty('--mx', `${(x / w) * 100}%`);
      el.style.setProperty('--my', `${(y / h) * 100}%`);
      const rx = (0.5 - y / h) * 2 * MAX_TILT;
      const ry = (x / w - 0.5) * 2 * MAX_TILT;
      el.style.transform =
        `perspective(720px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateZ(0)`;
    };

    const track = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      pending = { x: e.clientX - r.left, y: e.clientY - r.top, w: r.width, h: r.height };
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const light = () => el.style.setProperty('--lit', '1');
    const rest = () => {
      el.style.setProperty('--lit', '0');
      el.style.transform = '';
      el.style.removeProperty('--mx');
      el.style.removeProperty('--my');
    };

    el.addEventListener('pointerenter', light);
    el.addEventListener('pointermove', track);
    el.addEventListener('pointerleave', rest);
    /* Keyboard users get the lit state without the tilt, which is disorienting
       when it is not being driven by their own pointer. */
    el.addEventListener('focus', light);
    el.addEventListener('blur', rest);
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener('pointerenter', light);
      el.removeEventListener('pointermove', track);
      el.removeEventListener('pointerleave', rest);
      el.removeEventListener('focus', light);
      el.removeEventListener('blur', rest);
    };
  }, []);

  return (
    <article
      ref={ref}
      tabIndex={0}
      className="sc-card relative isolate overflow-hidden rounded-2xl bg-surface p-px
                 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px]"
    >
      <div className="sc-light pointer-events-none absolute inset-0 z-10 rounded-[inherit]" aria-hidden />
      <div className="sc-edge pointer-events-none absolute inset-0 z-20 rounded-[inherit] p-px" aria-hidden />
      <div className="relative z-30 rounded-[15px] bg-surface p-5">
        <p className="m-0 font-mono text-[.68rem] tracking-[.08em] text-accent">{card.kicker}</p>
        <h3 className="mb-[6px] mt-2 text-[1.12rem]">{card.title}</h3>
        <p className="m-0 text-[.88rem] leading-relaxed text-text-dim">{card.text}</p>
        <dl className="mt-[14px] flex gap-[22px] border-t border-border pt-3">
          {card.spec.map(([k, v]) => (
            <div key={k}>
              <dt className="font-mono text-[.64rem] text-text-dim">{k}</dt>
              <dd className="m-0 mt-[3px] text-[.86rem]">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export default function SpotlightCards() {
  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4">
      {CARDS.map((c) => <SpotlightCard key={c.kicker} card={c} />)}
    </div>
  );
}
