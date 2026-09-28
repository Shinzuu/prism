# Spatial Grid Nav

- **Element ID:** `spatial-grid-nav`
- **Type:** navbar
- **Live:** https://prism.shinzuu-dev.workers.dev/components/spatial-grid-nav
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/spatial-grid-nav.json

Arrow keys move to the tile the eye expects, scored from geometry rather than DOM order. How television interfaces have always worked and the web mostly forgot.

## Final prompt

```
Build spatial keyboard navigation for a grid of differently sized tiles, in plain HTML, CSS and vanilla JavaScript, no dependencies.

Arrow keys move to the tile a person would say is in that direction. Compute it from getBoundingClientRect, never from DOM index arithmetic — the moment a tile spans two columns, index maths and visual position disagree and the navigation stops matching the picture.

Two rules make the scoring correct. First, reject any candidate not strictly in the direction of travel: for Right, its left edge must be at or beyond the current right edge. Without that filter, the nearest element can be behind you and Right moves left. Second, score the distance along the axis of travel plus the drift across it weighted about 2.2 times, so a slightly offset neighbour beats a distant perfectly aligned one. Plain straight-line distance sends focus diagonally, which is the failure people notice without being able to name.

Use a roving tabindex: exactly one tile is tabbable so the grid is a single tab stop, and keep it in sync when focus arrives by any route, including a mouse click.

Home and End move to the first and last tile.

Call preventDefault on the handled keys so the page does not scroll underneath.

Announce the newly focused tile through a role="status" region, and give the grid role="grid" with an accessible name.

The focus style must be a filled state, not only an outline: on a grid of tiles an outline alone is easy to lose.

Colour comes only from CSS custom properties: var(--surface), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Add arrow key navigation to a grid of tiles.

Treated the grid as a fixed number of columns and moved by index arithmetic. That works only while every tile is the same size; the moment a tile spans two columns or two rows, DOM order and visual position disagree and pressing Right jumps somewhere unrelated to what is to the right.

### Attempt 2

> Compute the target from element positions instead of indices.

Chose the candidate with the smallest straight-line distance from the current centre, which sends focus diagonally: a tile up and to the right can be closer than the one directly right. It also allowed candidates behind the direction of travel, so Right could move left when the nearest element happened to be there.

## Why this one is worth keeping

The directional filter and the weighted score are the whole component, and each fixes a distinct, nameable wrongness.

Without the filter, navigation occasionally reverses, which destroys trust immediately. Without the weighting, focus drifts diagonally — technically the nearest element, visibly the wrong one. Both come from using a general distance function for a directional question, and both were fixed by stating what the result must look like to a person rather than what to compute.

The broader lesson is that index arithmetic is a trap in any layout that can reflow or span. It happens to work for uniform grids, which is why it survives review, and it fails the moment the design gets interesting. Computing from geometry costs one rect read per tile and never disagrees with what is on screen.
