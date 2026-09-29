const PANELS = [
  { id: 'dh-a', ground: 'bg-bg text-text', copy: 'Pale ground. The header sits above this and reads dark.' },
  { id: 'dh-b', ground: 'bg-text text-bg', copy: 'Ink ground. The same header now reads pale, with no scrim and no class change.' },
  { id: 'dh-c', ground: 'bg-accent text-accent-fg', copy: 'Saturated ground. Every glyph inverts against whatever is behind it, per pixel.' },
  { id: 'dh-d', ground: 'text-text-dim bg-[linear-gradient(100deg,var(--text)_0_46%,var(--bg)_46%_100%)]',
    copy: 'Split ground. One line of text, inverting differently along its own length.' },
];

export default function DifferenceHeader() {
  return (
    /* isolation:isolate creates the blending group. Without it the header would
       blend against everything behind this component, not against the panels. */
    <div className="relative isolate h-[260px] overflow-hidden rounded-xl border border-border">
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center gap-[18px] px-[18px] py-[14px]
                   dh-bar text-white mix-blend-difference pointer-events-none
                   forced-colors:mix-blend-normal forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]"
      >
        {/* No background on the bar. A background is exactly what defeats this:
            the text must have the page content itself as its backdrop. */}
        <span className="text-base font-bold tracking-[-.02em]">airframe</span>
        <nav className="ms-auto flex gap-[14px] text-[.82rem]">
          {['Plan', 'Profile', 'Loadout'].map((label, i) => (
            <a
              key={label}
              href={`#${PANELS[i]!.id}`}
              className="pointer-events-auto text-inherit no-underline hover:underline hover:underline-offset-[3px]"
            >
              {label}
            </a>
          ))}
        </nav>
      </header>

      <div tabIndex={0} role="region" aria-label="Scrolling page behind the header" className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth motion-reduce:scroll-auto">
        {PANELS.map((p) => (
          <section
            key={p.id}
            id={p.id}
            className={`grid min-h-full snap-start items-end p-[18px] ${p.ground}`}
          >
            <p className="m-0 max-w-[34ch] text-[.84rem]">{p.copy}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
