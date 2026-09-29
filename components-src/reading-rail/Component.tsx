import { useCallback, useEffect, useRef, useState } from 'react';

const SECTIONS = [
  { id: 's-intake', title: 'Intake geometry',
    body: 'Variable ramps trade pressure recovery against weight. Fixed geometry is lighter and simpler; a ramp buys you supersonic recovery at the cost of actuators that must not jam.' },
  { id: 's-sweep', title: 'Sweep programming',
    body: 'Automatic sweep schedules wing position against Mach and altitude. Pilots can override, but the schedule exists because the optimum moves faster than a hand can follow.' },
  { id: 's-glove', title: 'Glove vanes',
    body: 'Small surfaces in the leading edge extension shift the centre of lift forward at high Mach, offsetting the rearward migration that would otherwise trim the aircraft nose-down.' },
  { id: 's-nozzle', title: 'Nozzle scheduling',
    body: 'Convergent-divergent nozzles match exit area to pressure ratio. Mis-scheduled, they cost more thrust than the afterburner adds.' },
  { id: 's-carriage', title: 'Carriage loads',
    body: 'Stores on the glove pylons change the flutter boundary, so the sweep schedule is clamped whenever certain loads are carried.' },
];

export default function ReadingRail() {
  const docRef = useRef<HTMLElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [current, setCurrent] = useState(0);
  const [marker, setMarker] = useState({ top: 0, h: 0 });

  /* "Which heading is current" has no single right answer while two are on
     screen. Taking the LAST heading whose top has passed a reading line is
     stable; taking the topmost visible one flickers at every boundary. */
  const update = useCallback(() => {
    const doc = docRef.current;
    if (!doc) return;
    const lineY = doc.scrollTop + doc.clientHeight * 0.28;
    let i = 0;
    SECTIONS.forEach((s, n) => {
      const h = doc.querySelector<HTMLElement>(`#${s.id}`);
      if (h && h.offsetTop - doc.offsetTop <= lineY) i = n;
    });
    // At the very bottom the last section is current even if its heading is above the line.
    if (doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 4) i = SECTIONS.length - 1;
    setCurrent(i);
  }, []);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc) return;
    const onScroll = () => requestAnimationFrame(update);
    doc.addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', update);
    update();
    return () => { doc.removeEventListener('scroll', onScroll); removeEventListener('resize', update); };
  }, [update]);

  useEffect(() => {
    const a = linkRefs.current[current];
    if (a) setMarker({ top: a.offsetTop, h: a.offsetHeight });
  }, [current]);

  return (
    <div className="grid grid-cols-1 items-start gap-[22px] sm:grid-cols-[172px_1fr]">
      <nav aria-label="On this page" className="relative sm:sticky sm:top-2">
        <span aria-hidden className="rr-line absolute left-0 top-0 h-full w-0.5 rounded-sm bg-border"
              style={{ '--rr-top': `${marker.top}px`, '--rr-h': `${marker.h}px` } as React.CSSProperties} />
        <ol className="m-0 grid list-none gap-[3px] p-0 ps-[13px]">
          {SECTIONS.map((s, i) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                ref={(el) => { linkRefs.current[i] = el; }}
                aria-current={i === current}
                onClick={(e) => {
                  e.preventDefault();
                  const doc = docRef.current;
                  const h = doc?.querySelector<HTMLElement>(`#${s.id}`);
                  if (doc && h) doc.scrollTo({ top: h.offsetTop - doc.offsetTop - 4, behavior: 'smooth' });
                }}
                className={`block py-1 text-[.78rem] leading-tight no-underline ${
                  i === current ? 'font-medium text-text' : 'text-text-dim hover:text-text'
                }`}
              >
                {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <article ref={docRef} tabIndex={0} role="region" aria-label="Article body" className="max-h-[260px] overflow-y-auto pr-2">
        {SECTIONS.map((s, i) => (
          <section key={s.id}>
            <h3 id={s.id} className={`mb-[5px] text-[.94rem] scroll-mt-2 ${i ? 'mt-[18px]' : 'mt-0'}`}>{s.title}</h3>
            <p className="m-0 text-[.84rem] leading-relaxed text-text-dim">{s.body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}
