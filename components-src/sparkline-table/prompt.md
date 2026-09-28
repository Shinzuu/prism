# Sparkline Table

- **Element ID:** `sparkline-table`
- **Type:** table
- **Live:** https://prism.shinzuu-dev.workers.dev/components/sparkline-table
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/sparkline-table.json

A trend drawn per row and a heat wash behind each figure, so a table of numbers becomes scannable without becoming a chart. Each spark is scaled to its own row.

## Final prompt

```
Build a data table with per-row sparklines and heat-tinted figures, in plain HTML, CSS and vanilla JavaScript, no dependencies, using a real table.

Sparklines come from a comma-separated data-spark attribute on the cell and are drawn as inline SVG.

Scale each sparkline to its own row's minimum and maximum, never to a global range. A row moving between 30 and 34 has a shape worth seeing, and global scaling flattens it to a straight line — which defeats the purpose of putting a trend beside the number.

Draw three marks: a faint filled band under the line for weight, the line itself, and a dot on the final value so the eye lands on the current reading.

Heat tints come from a data-heat attribute between 0 and 1 and are drawn as an absolutely positioned wash behind the figure via a pseudo-element, never as a solid cell background. The number must remain the thing you read; the tint is context. Use color-mix on the accent with the heat value driving the percentage.

Accessibility: the sparkline is decoration, so mark the SVG aria-hidden and add one visually hidden sentence per row stating the direction and the first and last values in words. Do not attach the data to a title attribute — it does not surface on keyboard focus and most screen readers ignore it.

All figures use tabular-nums and right alignment; row headers use scope="row" and column headers scope="col"; the table has a caption explaining what the trend column covers.

Below about 560px, hide the trend column rather than compressing it — a sparkline narrower than about 80px is noise.

Colour comes only from CSS custom properties: var(--text), var(--text-dim), var(--border), var(--accent). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Add sparklines and heatmap colouring to a data table.

Scaled every sparkline to the global minimum and maximum across all rows, so the row whose values moved between 30 and 34 rendered as a flat line while one row with large values used the whole height. The shape of the small row — which is exactly what a sparkline is for — was erased. The heat colouring filled each cell with a solid background, which made the numbers harder to read than they were without it.

### Attempt 2

> Scale each row independently and make the tint subtler.

Scaling was fixed, but the sparklines were left as bare SVG with no text equivalent, so a screen reader got a table with an empty final column. A tooltip on the SVG was added instead, which does not surface on keyboard focus and is ignored by most screen readers.

## Why this one is worth keeping

Per-row scaling is the whole component, and it is the thing a model gets wrong by default because global scaling is what a chart library does. The justification is what makes the instruction stick: a sparkline exists to show the shape of one series next to its number, so normalising across series destroys the only information it carries.

The tint rule is a smaller version of the same idea. Filling the cell makes the table prettier and less readable, which is a bad trade in a table. Saying the number must remain the thing you read fixes the intent rather than the implementation.

The accessibility instruction repeats a pattern now established across this library: name which part is decoration, then state the fact once in text. It is faster to implement than any attempt to make the graphic itself readable, and it produces a better result.
