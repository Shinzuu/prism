# Snap Guide Canvas

- **Element ID:** `snap-guide-canvas`
- **Type:** section
- **Live:** https://prism.shinzuu-dev.workers.dev/components/snap-guide-canvas
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/snap-guide-canvas.json

Drag a block and it snaps to the edges, centres and — the part most implementations miss — the equal-spacing rhythm its neighbours already established, with the matched gap labelled.

## Final prompt

```
Build a small canvas where dragging a block shows alignment guides, in plain HTML, CSS, SVG and vanilla JavaScript.

Snap on three families of candidate:
1. Edges — left, right, top, bottom, including edge-to-edge against a neighbour.
2. Centres — horizontal and vertical.
3. EQUAL SPACING — measure the gap between each adjacent pair of existing blocks and offer that same gap on either side of the pair. This is the one that matters and the one usually missing: matching positions alone lets a block sit perfectly aligned while the gaps around it are 24, 24 and 9. Label the matched gap on the guide so it is legible.

Collect all candidates within tolerance FIRST and apply only the closest per axis. Applying each as it is found lets two competing snaps both fire and lands the block where neither asked.

Drive position through custom properties (--x, --y) and the translate property rather than left/top, so movement stays on the compositor. Use Pointer Events with setPointerCapture so the drag survives leaving the stage, and touch-action: none so it does not fight page scroll.

Clamp to the stage bounds before snapping, not after, or a snap can push the block outside.

Draw guides as SVG lines in an overlay sized to the stage, and clear them on drop — guides that persist after the drag read as a rendering bug. Distinguish spacing guides from alignment guides with a dash pattern.

The block must be keyboard operable: focusable, arrow keys to nudge, Shift for a larger step, with the same snapping applied, and an aria-live readout naming which guide matched. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a canvas where dragging a block shows alignment guides when it lines up with other blocks.

Applied every snap candidate within tolerance as it was found. Near two blocks at once, two competing horizontal snaps both applied and the block jumped to a position neither of them asked for. Candidates have to be collected and the closest one chosen per axis, not applied as encountered.

### Attempt 2

> Snap to edges and centres, choosing the nearest candidate on each axis.

Correct, and still not what a designer means by aligned. It only matched positions, so a block could sit flush with its neighbour's edge while the gaps around it were 24px, 24px and 9px. The rhythm of the layout is in the SPACING between items, and nothing was matching that.

## Why this one is worth keeping

Equal-spacing detection is what separates this from the alignment guides everyone writes. Matching edges and centres is easy and produces a layout that is aligned but arrhythmic — items flush to each other with uneven gaps between them — and it feels wrong without being obviously wrong. Measuring the gaps the neighbours already form, and offering those same gaps as snap targets, is what a designer actually means by 'line it up'. The implementation trap underneath is subtler: applying each snap candidate as it is found rather than collecting them and picking the nearest per axis, which lets two competing snaps combine and teleport the block somewhere neither one wanted.
