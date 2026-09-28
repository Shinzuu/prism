/* Opening a link pushes a pane to the right instead of replacing the view.
   The panes you came through collapse to spines rather than disappearing —
   that trail is the whole point, and hiding them turns this back into an
   ordinary drill-down that has forgotten where you are. */
(() => {
  /* Three levels deep on purpose. With a one-level tree the stack never
     exceeds two panes, so nothing ever collapses and the spines — the reason
     this pattern exists — can never be reached. */
  const TREE = {
    Runtime: { Isolates: ['Lifetime', 'Memory', 'Eviction'], 'Cold starts': ['Warm pool', 'P99'],
               'CPU limits': ['Budget', 'Overrun'], 'Env bindings': null },
    Storage: { KV: ['Reads', 'Writes', 'TTL'], 'Durable objects': ['Placement', 'Alarms'],
               R2: ['Multipart', 'Lifecycle'], Consistency: null },
    Routing: { Wildcards: ['Ordering', 'Escapes'], Precedence: ['Specificity'], Redirects: null },
    Limits:  { 'Request size': ['Body', 'Headers'], Subrequests: ['Depth', 'Fan-out'], Duration: null },
  };

  // Walk the path of pane titles to find what that pane should list.
  const nodeAt = (path) => path.reduce((n, k) => (n && !Array.isArray(n) ? n[k] : null), TREE);

  document.querySelectorAll('[data-sps]').forEach((root) => {
    const rail = root.querySelector('[data-sps-rail]');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');

    const panes = () => [...rail.querySelectorAll('[data-sps-pane]')];

    const collapseOlder = () => {
      const list = panes();
      list.forEach((p, i) => {
        // Keep the last two open: the one you are in and the one you came from.
        const collapsed = i < list.length - 2;
        if (collapsed) p.dataset.collapsed = ''; else p.removeAttribute('data-collapsed');
        p.setAttribute('aria-hidden', 'false');
        p.tabIndex = collapsed ? 0 : -1;
        p.setAttribute('role', collapsed ? 'button' : 'group');
        if (collapsed) p.setAttribute('aria-label', 'Reopen ' + (p.dataset.spsTitle || 'pane'));
      });
    };

    const scrollEnd = () => {
      rail.scrollTo({ left: rail.scrollWidth, behavior: reduced.matches ? 'auto' : 'smooth' });
    };

    const pathTo = (level) => panes().slice(1, level + 1).map((p) => p.dataset.spsTitle);

    const push = (title) => {
      const level = panes().length;
      const pane = document.createElement('section');
      pane.className = 'sps__pane';
      pane.dataset.spsPane = '';
      pane.dataset.spsLevel = String(level);
      pane.dataset.spsTitle = title;
      pane.setAttribute('aria-label', title);
      const node = nodeAt(pathTo(level - 1).concat(title));
      const items = Array.isArray(node) ? node : node ? Object.keys(node) : [];
      const openable = !Array.isArray(node) && !!node;
      pane.innerHTML =
        '<p class="sps__spine" aria-hidden="true">' + title + '</p>' +
        '<div class="sps__body"><p class="sps__h">' + title + '</p>' +
        (items.length
          ? '<ul class="sps__list">' + items.map((i) => '<li>' + (openable
              ? '<button class="sps__link" data-sps-open="' + i + '" type="button">' + i + '</button>'
              : '<p class="sps__leaf">' + i + '</p>') + '</li>').join('') + '</ul>'
          : '<p class="sps__leaf">No further sections.</p>') +
        '</div>';
      rail.append(pane);
      collapseOlder();
      // Wait a frame so the new pane has a width before scrolling to it.
      requestAnimationFrame(scrollEnd);
      return pane;
    };

    const dropAfter = (level) => {
      for (const p of panes()) {
        if (Number(p.dataset.spsLevel) > level) p.remove();
      }
      collapseOlder();
      requestAnimationFrame(scrollEnd);
    };

    rail.addEventListener('click', (e) => {
      const spine = e.target.closest('[data-collapsed]');
      if (spine) { dropAfter(Number(spine.dataset.spsLevel)); return; }

      const link = e.target.closest('[data-sps-open]');
      if (!link) return;
      const pane = link.closest('[data-sps-pane]');
      const level = Number(pane.dataset.spsLevel);
      for (const other of pane.querySelectorAll('[data-sps-open]')) {
        other.setAttribute('aria-expanded', String(other === link));
      }
      dropAfter(level);
      push(link.dataset.spsOpen);
    });

    rail.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const spine = e.target.closest('[data-collapsed]');
      if (!spine) return;
      e.preventDefault();
      dropAfter(Number(spine.dataset.spsLevel));
    });

    panes()[0].dataset.spsTitle = 'Sections';
    collapseOlder();
  });
})();
