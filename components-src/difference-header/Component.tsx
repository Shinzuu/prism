export type DifferencePanel = {
  /** Anchor id the header links jump to. */
  id: string;
  /** Classes that paint the panel's ground and text colour. */
  ground: string;
  copy: string;
  /** Header link label for this panel; panels without one get no link. */
  nav?: string;
};

const DEFAULT_PANELS: DifferencePanel[] = [
  { id: 'dh-a', ground: 'bg-bg text-text', copy: 'Pale ground. The header sits above this and reads dark.', nav: 'Plan' },
  { id: 'dh-b', ground: 'bg-text text-bg', copy: 'Ink ground. The same header now reads pale, with no scrim and no class change.', nav: 'Profile' },
  { id: 'dh-c', ground: 'bg-accent text-accent-fg', copy: 'Saturated ground. Every glyph inverts against whatever is behind it, per pixel.', nav: 'Loadout' },
  { id: 'dh-d', ground: 'text-text-dim bg-[linear-gradient(100deg,var(--text)_0_46%,var(--bg)_46%_100%)]',
    copy: 'Split ground. One line of text, inverting differently along its own length.' },
];

export interface DifferenceHeaderProps {
  /** Wordmark at the start of the header. */
  brand?: string;
  /** Scrolling sections behind the header, top to bottom. */
  panels?: DifferencePanel[];
  /** Accessible name of the scrolling region. */
  regionLabel?: string;
  /** Extra classes for the root element. */
  className?: string;
}

export default function DifferenceHeader({
  brand = 'airframe',
  panels = DEFAULT_PANELS,
  regionLabel = 'Scrolling page behind the header',
  className = '',
}: DifferenceHeaderProps) {
  return (
    /* isolation:isolate creates the blending group. Without it the header would
       blend against everything behind this component, not against the panels. */
    <div className={`relative isolate h-[260px] overflow-hidden rounded-xl border border-border ${className}`}>
      <header
        className="absolute inset-x-0 top-0 z-20 flex items-center gap-[18px] px-[18px] py-[14px]
                   dh-bar text-white mix-blend-difference pointer-events-none
                   forced-colors:mix-blend-normal forced-colors:bg-[Canvas] forced-colors:text-[CanvasText]"
      >
        {/* No background on the bar. A background is exactly what defeats this:
            the text must have the page content itself as its backdrop. */}
        <span className="text-base font-bold tracking-[-.02em]">{brand}</span>
        <nav className="ms-auto flex gap-[14px] text-[.82rem]">
          {panels.filter((p) => p.nav).map((p) => (
            <a
              key={p.id}
              href={`#${p.id}`}
              // outline-current, not accent: the outline blends with the bar, so it must invert like the text does.
              className="pointer-events-auto text-inherit no-underline hover:underline hover:underline-offset-[3px] active:opacity-80 focus-visible:outline-2 focus-visible:outline-current focus-visible:outline-offset-2"
            >
              {p.nav}
            </a>
          ))}
        </nav>
      </header>

      <div tabIndex={0} role="region" aria-label={regionLabel} className="h-full snap-y snap-mandatory overflow-y-auto scroll-smooth motion-reduce:scroll-auto focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        {panels.map((p) => (
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
