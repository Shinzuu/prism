import { useEffect, useState, type ReactNode } from 'react';

const DEFAULT_PANELS = ['Survey', 'Foundations', 'Frame', 'Envelope', 'Handover'];
const DEFAULT_INTRO = 'Scroll. Each panel rotates open on the hinge it shares with the one before it, so the fold travels down the stack like a map opening.';
const DEFAULT_OUTRO = "The hinge is the shared edge: each panel's transform-origin is its own top, so the fold is continuous rather than five separate flips.";

export interface FoldRevealSectionProps {
  /** Text of each panel, top to bottom. */
  panels?: string[];
  /** Paragraph above the panels. */
  intro?: ReactNode;
  /** Paragraph below the panels. */
  outro?: ReactNode;
  /** Accessible name of the scrolling region. */
  regionLabel?: string;
  /** Shows the line reporting which animation path the browser took. */
  showNote?: boolean;
  /** Extra classes for the root element. */
  className?: string;
}

export default function FoldRevealSection({
  panels = DEFAULT_PANELS,
  intro = DEFAULT_INTRO,
  outro = DEFAULT_OUTRO,
  regionLabel = 'Folding panels',
  showNote = true,
  className = '',
}: FoldRevealSectionProps) {
  const [note, setNote] = useState('');

  /* The fold is entirely CSS — a view timeline, no scroll listener. This only
     reports which path the browser took, because "unsupported" and "broken"
     are otherwise indistinguishable on screen. */
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const supported = CSS.supports('animation-timeline: view()');
    setNote(
      reduced ? 'reduced motion — panels shown open, no fold'
      : supported ? 'animation-timeline: view() — no scroll listener, no main-thread work'
      : 'scroll-driven animations unsupported — panels shown open'
    );
  }, []);

  return (
    <div className={`grid gap-2 ${className}`}>
      {/* perspective lives on the SCROLLER, not the panels: per-element
          perspective gives each panel its own vanishing point, so five panels
          fold toward five centres instead of one map opening. */}
      <div tabIndex={0} role="region" aria-label={regionLabel} className="frs-scroll h-[250px] overflow-y-auto rounded-[9px] border border-border bg-bg p-3 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent">
        <p className="m-0 mb-3 max-w-[44ch] text-[.74rem] leading-relaxed text-text-dim">
          {intro}
        </p>

        <div className="frs-map grid gap-1">
          {panels.map((p, i) => (
            <section
              key={i}
              className="frs-panel flex items-baseline gap-[10px] rounded-[7px] border border-border px-[14px] py-4"
              style={{ '--frs-i': i } as React.CSSProperties}
            >
              <span className="font-mono text-[.62rem] text-text-dim">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="m-0 text-[.86rem]">{p}</p>
            </section>
          ))}
        </div>

        <p className="m-0 mt-3 max-w-[44ch] text-[.74rem] leading-relaxed text-text-dim">
          {outro}
        </p>
      </div>
      {showNote && <p className="m-0 font-mono text-[.64rem] text-text-dim">{note}</p>}
    </div>
  );
}
