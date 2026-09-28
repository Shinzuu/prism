import { useEffect, useRef, useState } from 'react';

/* Three levels deep on purpose. With a one-level tree the stack never exceeds
   two panes, so nothing ever collapses and the spines — the reason this
   pattern exists — can never be reached. */
type Node = Record<string, string[] | null>;
const TREE: Record<string, Node> = {
  Runtime: { Isolates: ['Lifetime', 'Memory', 'Eviction'], 'Cold starts': ['Warm pool', 'P99'],
             'CPU limits': ['Budget', 'Overrun'], 'Env bindings': null },
  Storage: { KV: ['Reads', 'Writes', 'TTL'], 'Durable objects': ['Placement', 'Alarms'],
             R2: ['Multipart', 'Lifecycle'], Consistency: null },
  Routing: { Wildcards: ['Ordering', 'Escapes'], Precedence: ['Specificity'], Redirects: null },
  Limits: { 'Request size': ['Body', 'Headers'], Subrequests: ['Depth', 'Fan-out'], Duration: null },
};
const ROOT = Object.keys(TREE);

export default function SlidingPaneStack() {
  const [path, setPath] = useState<string[]>([]);
  const railRef = useRef<HTMLDivElement>(null);

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
    { title: 'Sections', items: ROOT, openable: true },
  ];
  let node: Node | string[] | null = null;
  path.forEach((key, i) => {
    node = i === 0 ? TREE[key]! : (node && !Array.isArray(node) ? node[key] ?? null : null);
    const items = Array.isArray(node) ? node : node ? Object.keys(node) : [];
    panes.push({ title: key, items, openable: !Array.isArray(node) && !!node });
  });

  const total = panes.length;

  return (
    <nav aria-label="Documentation" className="grid gap-2">
      <div
        ref={railRef}
        className="sps-rail flex h-[210px] items-stretch overflow-x-auto rounded-[10px] border border-border bg-bg"
      >
        {panes.map((pane, level) => {
          // Keep the last two open; everything older becomes a spine.
          const collapsed = level < total - 2;
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
                collapsed ? 'w-[2.1rem] cursor-pointer' : 'w-[15rem]'
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
                            className={`flex w-full cursor-pointer justify-between gap-2 rounded-md border-0 bg-transparent px-2 py-1.5 text-start font-sans text-[.76rem] after:text-text-dim after:content-['›'] hover:bg-raised focus-visible:outline-2 focus-visible:outline-accent focus-visible:-outline-offset-1 ${
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
                  <p className="m-0 px-2 py-1.5 text-[.74rem] text-text-dim">No further sections.</p>
                )}
              </div>
            </section>
          );
        })}
      </div>
      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Opening a link pushes a pane instead of replacing the view, so the path you took stays on
        screen. Older panes collapse to spines — click one to come back.
      </p>
    </nav>
  );
}
