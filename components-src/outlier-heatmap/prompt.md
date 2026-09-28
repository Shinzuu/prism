# Outlier Heatmap

- **Element ID:** `outlier-heatmap`
- **Type:** chart
- **Live:** https://prism.shinzuu-dev.workers.dev/components/outlier-heatmap
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/outlier-heatmap.json

Drag a box around the slow cluster and it ranks which dimension values are over-represented inside it versus outside. Answers why the p99 is bad rather than restating that it is.

## Final prompt

```
Build an interactive scatter plot for diagnosing latency outliers, in plain HTML, CSS, canvas and vanilla JavaScript.

Plot about 1,400 requests as latency against payload size. Each point also carries categorical dimensions — region, tier, client, cache hit or miss. Plant a real cause in the data: make one COMBINATION slow, for example ap-south on a cache miss. Nothing in the interface should name it; the component's job is to let someone find it.

Drag a rectangle over the plot to select points. The selection must produce a RANKED LIST of dimension values, and the ranking measure is lift — the rate of that value inside the box divided by its rate outside — never the raw count inside. Raw counts simply re-rank the most common values overall and bury the cause; this is the entire point of the component.

Two guards are required. Clamp the outside rate away from zero (floor it at one over the total point count), or any value absent outside the box scores infinite lift and wins off a single stray point. And drop values holding less than about 8% of the selection, so a rare value cannot top the list on noise. Below about a dozen selected points, refuse to rank and say so rather than showing a ranking that cannot mean anything.

Draw with canvas, not SVG: at this point count SVG creates 1,400 nodes and the drag stutters. Read var(--accent) and var(--text-dim) through getComputedStyle rather than hard-coding, so the canvas follows the site palette. Dim unselected points and highlight selected ones.

Use Pointer Events with setPointerCapture so the drag survives leaving the canvas, and touch-action: none so it does not fight page scroll. A canvas is invisible to assistive technology, so give the plot a keyboard path: focusable, with Enter selecting the slowest decile and ranking it, and put the ranked list in the DOM as real text inside an aria-live region.

Use tokens only: var(--accent), var(--bg), var(--border), var(--text), var(--text-dim), var(--mono). No literal colours in the stylesheet. Use a seeded pseudo-random generator so the demo tells the same story on every load.
```

## What failed first

### Attempt 1

> Build a scatter chart of request latency where you can select a region of points and see a breakdown of the selection.

Broke the selection down by raw count. The top of the list was region = us-east and tier = free every time — not because they were slow, but because they were the most common values overall. Counting inside the box only re-ranks the base rates and buries the actual cause.

### Attempt 2

> Rank the dimensions by how over-represented each value is inside the selection compared to outside it.

Lift was the right measure and the implementation divided by a rate that can be zero. Any value that happened not to appear outside the box scored infinity and took first place off a single stray point, so the ranking was dominated by noise exactly when the selection was small.

## Why this one is worth keeping

The interesting failure is statistical, not visual. Ranking the selection by count feels obviously right and is obviously wrong: it returns whatever is most common overall, so the answer is the same no matter which box you drag. Lift fixes that and introduces its own trap — a zero denominator makes any value that is merely absent outside the box score infinity, so the ranking is loudest precisely when the sample is smallest and least trustworthy. Both guards, the floored denominator and the minimum share, exist to stop the component from being most confident when it knows least. The rest is a normal scatter plot; the ranking is the component.
