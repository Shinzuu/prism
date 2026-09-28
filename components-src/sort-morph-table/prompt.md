# Sort Morph Table

- **Element ID:** `sort-morph-table`
- **Type:** table
- **Live:** https://prism.shinzuu-dev.workers.dev/components/sort-morph-table
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/sort-morph-table.json

Sort a column and the rows travel to their new positions instead of teleporting, so the row you were reading stays findable. FLIP with the Web Animations API — no library.

## Final prompt

```
Build a sortable table whose rows physically travel to their new positions when the sort changes, in plain HTML, CSS and vanilla JavaScript with no library.

Use FLIP, in this order:
1. FIRST — before touching the DOM, record each row's current top with getBoundingClientRect(). Use getBoundingClientRect, NOT offsetTop: offsetTop ignores transforms, so a second sort while rows are still transformed reads the wrong origin and the rows drift further out with every click.
2. Reorder and re-render.
3. LAST — measure each row again.
4. INVERT — compute the delta and animate from translateY(delta) to none.
5. PLAY — use element.animate() from the Web Animations API rather than inline styles plus a transition, so there are no leftover styles to clean up and the animation object can be awaited.

Explain in a comment why a plain CSS transition cannot do this: reordering removes and reinserts the element, so there is no previous value to interpolate from and nothing animates — silently.

Key each row by a stable identifier so rows are matched across the re-render, not by index. Give the moving rows position: relative with a raised z-index and an opaque background while animating, so a travelling row passes over its neighbours instead of through them; without that the motion reads as a flicker.

Sort headers must be real <button> elements inside <th>, toggling direction on repeat clicks, with aria-sort on the active one and a live region announcing the new order — the animation is decoration, the announcement is the accessible equivalent. Under prefers-reduced-motion, reorder instantly and skip the animation entirely.

Use tokens only: var(--accent), var(--bg), var(--border), var(--text), var(--text-dim), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a sortable table where the rows animate into their new order.

Applied a CSS transition to the rows and reordered the DOM. Nothing animated. Reordering elements is not a property change — the row is removed and reinserted at a new position, so there is no start value for a transition to interpolate from, and no error says so.

### Attempt 2

> Use FLIP: record positions, reorder, then animate from the old position to the new one.

Recorded the starting positions with offsetTop. It is correct on the first sort and wrong on every sort after, because offsetTop ignores transforms: sorting again while rows still carry a transform reads the pre-transform layout position, so rows animate from the wrong place and drift further out on each click.

## Why this one is worth keeping

Both failures are silent. A CSS transition on reordered rows does nothing at all — no warning, no error, just a table that teleports — because reordering is not a property change and there is no from-value to interpolate. Then FLIP with offsetTop works perfectly on the first sort and degrades on every one after, which is the worst possible failure shape: it passes the obvious test and breaks under repetition, with rows drifting further from their true positions each click. getBoundingClientRect reports post-transform geometry, which is exactly what FLIP needs and exactly what offsetTop refuses to give.
