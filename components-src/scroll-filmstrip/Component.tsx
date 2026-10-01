/** One card in the strip. `no` is the small index label above the title. */
export type FilmPanel = { no: string; title: string; body: string };

const DEFAULT_PANELS: FilmPanel[] = [
  { no: '01', title: 'Vertical in, horizontal out',
    body: 'Scrolling this box down drives the strip sideways. The browser maps one axis onto the other with no script listening for anything.' },
  { no: '02', title: 'Runs off the main thread',
    body: 'A declarative timeline can be handed to the compositor, so the pan holds its frame rate while the page is busy elsewhere.' },
  { no: '03', title: 'Self-contained',
    body: 'The timeline is named on this container, not on the document, so the section behaves the same inside a preview frame as it does full width.' },
  { no: '04', title: 'Nothing hidden behind support',
    body: 'Where scroll timelines are unavailable the strip stays a plain horizontal scroller. Every panel is reachable either way.' },
];

export interface ScrollFilmstripProps {
  /** Cards panned across as the box scrolls, left to right. */
  panels?: FilmPanel[];
  /** Accessible name of the scroll region. */
  ariaLabel?: string;
  /** Hint shown in the corner of the stage. */
  hint?: string;
  /** Height of the visible stage in px; the scroll runway is three times this. */
  height?: number;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function ScrollFilmstrip({
  panels = DEFAULT_PANELS,
  ariaLabel = 'Scroll-driven filmstrip',
  hint = 'scroll inside',
  height,
  className = '',
}: ScrollFilmstripProps) {
  return (
    <div
      className={`fs ${className}`}
      style={height === undefined ? undefined : ({ '--fs-h': `${height}px` } as React.CSSProperties)}
      tabIndex={0} role="region" aria-label={ariaLabel}
    >
      <div className="fs-stage">
        <div className="fs-rail flex gap-[18px] px-[22px] will-change-transform">
          {panels.map((p) => (
            <article
              key={p.no}
              className="basis-[min(300px,78%)] shrink-0 grow-0 rounded-xl border border-border bg-surface p-5"
            >
              <p className="m-0 font-mono text-[.68rem] tracking-[.08em] text-accent">{p.no}</p>
              <h3 className="mb-[6px] mt-[6px] text-[1.02rem]">{p.title}</h3>
              <p className="m-0 text-[.86rem] leading-relaxed text-text-dim">{p.body}</p>
            </article>
          ))}
        </div>

        <div className="fs-bar absolute inset-x-[22px] bottom-4 h-0.5 rounded-sm bg-border" aria-hidden>
          <i className="block h-full w-full origin-left rounded-[inherit] bg-accent" />
        </div>
        <p className="absolute bottom-[30px] right-[22px] m-0 font-mono text-[.62rem] text-text-dim" aria-hidden>
          {hint}
        </p>
      </div>
      <div className="fs-runway" aria-hidden />
    </div>
  );
}
