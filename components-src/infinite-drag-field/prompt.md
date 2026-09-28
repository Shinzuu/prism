# Infinite Drag Field

- **Element ID:** `infinite-drag-field`
- **Type:** input
- **Live:** https://prism.shinzuu-dev.workers.dev/components/infinite-drag-field
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/infinite-drag-field.json

Drag the label and the number climbs forever — the cursor is hidden and unbound from the screen, so the drag has no edge, with modifier keys changing the gearing.

## Final prompt

```
Build a draggable number scrubber — drag the label sideways to change the value — in plain HTML, CSS and vanilla JavaScript.

Request Pointer Lock on pointerdown so the cursor is hidden and unbound from the screen, and read e.movementX, NOT clientX. This is the crux: under Pointer Lock the cursor does not move, so clientX freezes and a clientX-based scrubber stops dead the moment the lock engages. movementX keeps reporting indefinitely, which is what makes the drag infinite.

requestPointerLock returns a promise in current Chrome and undefined in older engines, so await it inside try/catch and verify with document.pointerLockElement rather than trusting the call. Fall back to accumulating movementX without the lock when it is unavailable, and SAY in the readout which mode is active — an edge-limited fallback that pretends to be infinite is worse than one that admits it.

Pass unadjustedMovement: true so pointer acceleration does not make the gearing inconsistent between a slow and a fast drag.

Accumulate fractional movement and apply only whole steps, so fine gearing does not lose sub-pixel motion. Let Shift multiply the gearing by ten and Alt divide it by ten.

Keep the input a real <input type="number"> that can still be typed into and focused. Give the drag handle role="slider" with aria-valuenow kept in sync, and arrow keys, Shift and Home as the keyboard equivalent — a drag is a pointer gesture and cannot be the only way to reach a value.

Set touch-action: none and user-select: none on the handle. Exit the lock on pointerup and on pointerlockchange. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a number field whose label can be dragged left and right to change the value, like a design tool.

Tracked clientX and subtracted the start position. It works until the cursor reaches the edge of the screen, which at normal gearing happens within about a second — the pointer stops, the value freezes, and the only way to continue is to release and start again. Every drag is therefore bounded by how much screen is left to the right of the label.

### Attempt 2

> Use Pointer Lock so the cursor is unbound from the screen.

Requested the lock and kept reading clientX, which is frozen once the cursor is hidden — the value stopped changing entirely, so the lock made it worse. Under lock the only meaningful delta is movementX. Pointer Lock is also promise-based in current Chrome and synchronous in older engines, so awaiting it without a try/catch threw on the engines that return undefined.

## Why this one is worth keeping

The interesting part is that the fix and the bug interact: Pointer Lock is exactly the right tool, and adding it to a clientX-based scrubber makes the control completely dead rather than merely limited. Once the cursor is hidden it stops moving, so clientX is constant and the value never changes — the improvement looks like a total regression, which is a strong incentive to back it out and keep the edge-limited version. movementX is the only delta that survives the lock. The secondary lesson is about honesty in the fallback: telling the user which mode is active costs one line and prevents the edge-limited path from being mistaken for a broken infinite one.
