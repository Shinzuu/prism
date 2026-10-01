import { useEffect, useRef, useState } from 'react';

/* Three levels deep on purpose. With a one-level tree the stack never exceeds
   two panes, so nothing ever collapses and the spines — the reason this
   pattern exists — can never be reached. */
export type PaneNode = Record<string, string[] | null>;
export type PaneTree = Record<string, PaneNode>;
const DEFAULT_TREE: PaneTree = {
  Runtime: { Isolates: ['Lifetime', 'Memory', 'Eviction'], 'Cold starts': ['Warm pool', 'P99'],
             'CPU limits': ['Budget', 'Overrun'], 'Env bindings': null },
  Storage: { KV: ['Reads', 'Writes', 'TTL'], 'Durable objects': ['Placement', 'Alarms'],
             R2: ['Multipart', 'Lifecycle'], Consistency: null },
  Routing: { Wildcards: ['Ordering', 'Escapes'], Precedence: ['Specificity'], Redirects: null },
  Limits: { 'Request size': ['Body', 'Headers'], Subrequests: ['Depth', 'Fan-out'], Duration: null },
};

export interface SlidingPaneStackProps {
  /** Three-level tree: sections, their pages (null for a leaf), and each page's topics. */
  tree?: PaneTree;
  /** Heading of the first pane, which lists the top-level sections. */
  rootTitle?: string;
  /** Accessible name of the nav landmark. */
  ariaLabel?: string;
  /** How many of the newest panes stay open before older ones collapse to spines. */
  openPanes?: number;
  /** Shown in a pane that has nothing under it. */
  emptyText?: string;
  /** Explanatory note under the rail. */
  description?: string;
  /** Fired when the open path changes, with the keys from the root down. */
  onNavigate?: (path: string[]) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function SlidingPaneStack({
  tree: TREE = DEFAULT_TREE,
  rootTitle = 'Sections',
  ariaLabel = 'Documentation',
  openPanes = 2,
  emptyText = 'No further sections.',
  description = 'Opening a link pushes a pane instead of replacing the view, so the path you took stays on screen. Older panes collapse to spines — click one to come back.',
  onNavigate,
  className = '',
}: SlidingPaneStackProps) {
  const [path, setPathState] = useState<string[]>([]);
  const railRef = useRef<HTMLDivElement>(null);
  const ROOT = Object.keys(TREE);

  const setPath = (next: string[]) => {
    setPathState(next);
    onNavigate?.(next);
  };

  // Wait a frame: scrolling in the same tick as the insertion reads the old
  // scrollWidth and lands short.
  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    requestAnimationFrame(() =>
      rail.scrollTo({ left: rail.scrollWidth, behavior: reduced ? 'auto' : 'smooth' })
    );
  }, [path]);

  const panes: { title: string; items: string[]; openable: boolean }[] = [
    { title: rootTitle, items: ROOT, openable: true },
  ];
  let node: PaneNode | string[] | null = null;
  path.forEach((key, i) => {
    node = i === 0 ? TREE[key] ?? null : (node && !Array.isArray(node) ? node[key] ?? null : null);
    const items = Array.isArray(node) ? node : node ? Object.keys(node) : [];
    panes.push({ title: key, items, openable: !Array.isArray(node) && !!node });
  });

  const total = panes.length;

  return (
    <nav aria-label={ariaLabel} className={`grid gap-2 ${className}`}>
      <div
        ref={railRef}
        className="sps-rail flex h-[210px] items-stretch overflow-x-auto rounded-[10px] border border-border bg-bg"
      >
        {panes.map((pane, level) => {
          // Keep the last two open; everything older becomes a spine.
          const collapsed = level < total - openPanes;
          return (
            <section
              key={`${pane.title}-${level}`}
              aria-label={collapsed ? `Reopen ${pane.title}` : pane.title}
              role={collapsed ? 'button' : 'group'}
              tabIndex={collapsed ? 0 : -1}
              onClick={collapsed ? () => setPath(path.slice(0, level)) : undefined}
              onKeyDown={collapsed ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setPath(path.slice(0, level)); }
              } : undefined}
              className={`sps-pane relative grid shrink-0 snap-end border-e border-border last:border-e-0 last:grow ${
                collapsed ? 'w-[2.1rem] cursor-pointer hover:bg-raised active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-2' : 'w-[15rem]'
              }`}
            >
              {/* A collapsed pane stays a labelled, focusable control. Hidden,
                  it is just a gap — and the visible trail is the whole point. */}
              <p aria-hidden className={`sps-spine pointer-events-none absolute inset-0 m-0 grid place-items-center overflow-hidden whitespace-nowrap text-[.68rem] text-text-dim ${collapsed ? 'opacity-100' : 'opacity-0'}`}>
                {pane.title}
              </p>
              <div className={`sps-body overflow-y-auto px-3 py-[11px] ${collapsed ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                <p className="m-0 mb-2 font-mono text-[.68rem] text-text-dim">{pane.title}</p>
                {pane.items.length ? (
                  <ul className="m-0 grid list-none gap-0.5 p-0">
                    {pane.items.map((item) =>
                      <li key={item}>
                        {pane.openable ? (
                          <button
                            type="button"
                            aria-expanded={path[level] === item}
                            onClick={() => setPath([...path.slice(0, level), item])}
                            className={`flex w-full cursor-pointer justify-between gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-start font-sans text-[.76rem] after:text-text-dim after:content-['›'] hover:bg-raised active:opacity-80 focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-1 ${
                              path[level] === item ? 'bg-raised text-accent' : 'text-text'
                            }`}
                          >
                            {item}
                          </button>
                        ) : (
                          <p className="m-0 px-2 py-1.5 text-[.74rem] leading-relaxed text-text-dim">{item}</p>
                        )}
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="m-0 px-2 py-1.5 text-[.74rem] text-text-dim">{emptyText}</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{description}</p>
    </nav>
  );
}
