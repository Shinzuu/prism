# Magic Plus Drag

- **Element ID:** `magic-plus-drag`
- **Type:** button
- **Live:** https://prism.shinzuu-dev.workers.dev/components/magic-plus-drag
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/magic-plus-drag.json

The plus is not clicked — it is torn off and dropped between two rows, and the step is created exactly there. The list parts to show where it will land.

## Final prompt

```
Build an add-item control that is dragged rather than clicked, in plain HTML, CSS and vanilla JavaScript.

The plus is torn off and dropped into a gap between two rows, and the new item is created at exactly that position. Do not append and then let the user reorder: the position is the decision, so making it last is backwards.

Choose the target gap by comparing the pointer's y against each row's MIDPOINT, not its top or bottom edge. Edge comparison means the target only changes after the pointer has fully cleared a row, which feels sticky and trails the cursor by a whole row.

The drop indicator must be a REAL ELEMENT inserted into the list, animating from zero height, so the rows physically part to make room. An absolutely positioned marker floating over the rows shows a line but moves nothing, and the point is to show the space the item will occupy.

On drop, insert the row with a focused text input already in it, committing on Enter or blur and removing itself if left empty. Escape cancels.

Use Pointer Events with setPointerCapture and touch-action: none. Position the dragged plus with position: fixed and pointer-events: none so it cannot become its own drop target. If the pointer leaves the list area, close the slot so a stray drag cancels cleanly rather than inserting somewhere arbitrary.

Dragging is a pointer idiom, so provide a keyboard equivalent of the same intention: Enter arms the insert, arrow keys move the gap, Enter confirms, Escape cancels. Announce the chosen position through an aria-live region.

Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours. Respect prefers-reduced-motion on the slot animation.
```

## What failed first

### Attempt 1

> Build an add button that inserts a new item into a list.

Appended to the end, leaving the user to drag it into position afterwards. Two gestures for one intention, and the first one deliberately puts the item somewhere nobody asked for — the position is the thing being decided, so deciding it last is backwards.

### Attempt 2

> Let the plus be dragged and drop the new item at the drop position.

Chose the insert index by comparing the pointer against each row's top edge, so the target only changed once the pointer had fully cleared a row. It felt sticky and lagged the cursor by a whole row. Comparing against the row's MIDPOINT flips the boundary where the eye expects it. The drop marker was also absolutely positioned over the rows, so nothing moved to show where the item would go.

## Why this one is worth keeping

The insight is that position is the decision. An add button that appends forces the user to state their intention in two steps and guarantees the first one is wrong. Once the plus is draggable, the feel comes down to one comparison: testing the pointer against row midpoints rather than edges is the difference between a target that moves with your eye and one that lags a full row behind. The second detail is making the drop indicator a real list child — a floating line tells you where the item goes, but rows parting show you the space it will take, and only one of those is legible at a glance.
