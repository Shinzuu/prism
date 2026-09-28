# Endless Ledger

- **Element ID:** `endless-ledger`
- **Type:** table
- **Live:** https://prism.shinzuu-dev.workers.dev/components/endless-ledger
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/endless-ledger.json

Fifty thousand real rows in the DOM that paint in milliseconds and scroll smoothly, with a scrollbar that does not jitter. No virtualization library, no windowing, no scroll listener.

## Final prompt

```
Render a table of fifty thousand rows in plain HTML, CSS and vanilla JavaScript, with no virtualization library, no windowing and no scroll listener.

The performance comes from two CSS declarations on the rows, not from JavaScript:

content-visibility: auto tells the browser to skip layout and paint for rows outside the viewport. On its own this is what makes scrolling smooth.

contain-intrinsic-size: auto 25px is the half people omit, and without it the component is unusable. A skipped row has no height, so the scroll height collapses and the scrollbar jumps and resizes as rows come into view. The placeholder height keeps the scrollbar honest, and the auto keyword makes the browser remember each row's real height once it has been measured.

Build the rows into a DocumentFragment and insert once. Appending inside the loop forces layout per row and locks the tab for seconds before anything appears.

Measure the time to first paint honestly: take the timestamp inside a double requestAnimationFrame, not at the end of the build loop, and show it — the number is the component's argument.

Keep the header sticky with position: sticky on the th, and make the scroll container focusable with role="region" and a label stating the row count, so it is reachable and announced.

Figures use tabular-nums and right alignment.

Colour comes only from CSS custom properties: var(--bg), var(--raised), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Render a table of 50,000 rows that stays responsive.

Appended each row to the tbody inside the loop, forcing layout fifty thousand times and locking the tab for several seconds before anything appeared. Once it did render, scrolling stuttered badly because every row was being laid out and painted whether or not it was anywhere near the viewport.

### Attempt 2

> Add content-visibility: auto to the rows.

Scrolling became smooth, but the scrollbar was unusable: each row collapsed to zero height until it was scrolled near, so the thumb jumped and resized continuously and dragging it overshot wildly. The row heights were also being measured and remeasured, so the total height kept changing under the user.

## Why this one is worth keeping

The instinct on hearing fifty thousand rows is to reach for react-window or TanStack Virtual, and the whole point of this component is that the platform now does it in two declarations. But the reason people try content-visibility, see the scrollbar misbehave and go back to a library is contain-intrinsic-size — so stating both together, with what the second one prevents, is the difference between a working technique and an abandoned one.

The DocumentFragment detail belongs in the same prompt because the failure it prevents looks identical to the problem being solved: a frozen tab. Someone who fixes only the scrolling still has a component that takes four seconds to appear, and will blame the wrong thing.

Measuring after a double rAF rather than after the loop is a small honesty point. The loop finishing is not the browser having painted, and a component whose selling point is speed should not quote a number that excludes the expensive part. Ported to React the component also recorded a cost worth stating: the same 50,000 rows that painted in 1,809ms as a plain script take about 3,700ms inside the React island with a utility stylesheet loaded. The row-building work is unchanged — profiled in the live page it is 59ms to build, 126ms to parse and 447ms to lay out — so the difference is style resolution against a far larger stylesheet plus the island's own mount, both of which scale with the number of elements. The measurement also had to be gated on document.fonts.ready: before that it reported 6,250ms, of which 3,468ms was a font fetch the paint callback was queued behind, which would have made the component's one claim wrong in the direction that flattered it.
