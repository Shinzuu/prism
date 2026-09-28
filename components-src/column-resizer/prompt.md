# Column Resizer

- **Element ID:** `column-resizer`
- **Type:** table
- **Live:** https://prism.shinzuu-dev.workers.dev/components/column-resizer
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/column-resizer.json

Drag a divider or resize from the keyboard, with widths that persist and a layout that never shifts mid-drag.

## Final prompt

```
Build resizable table columns in plain HTML, CSS and vanilla JavaScript, no dependencies, using a real table.

Set table-layout: fixed. Without it the browser renegotiates every column width on each change and the table shifts under the pointer while dragging, which makes precise sizing impossible. This is the single decision the component depends on.

Drive widths from a custom property on each header cell so one write updates the column.

The handle is role="separator" with aria-orientation="vertical", tabindex 0, an aria-label naming the column it resizes, and a live aria-valuenow. Do not make it a button: a button announces an action it does not perform, and a separator is exactly what this is.

Keyboard: Arrow Left and Right resize by 8 pixels, Shift by 40, Home collapses to the minimum, Enter restores that column's default. Clamp at a sensible minimum so a column cannot be dragged out of existence.

Call setPointerCapture on pointerdown, and compute from the width measured at drag start plus the pointer delta rather than from the current width each frame, so rounding does not accumulate across a long drag.

Persist the widths to localStorage and restore them on load, wrapped in try/catch — storage throws in private mode and the component must still work, just without remembering.

Write to storage on drag end and on each keyboard step, never on every pointermove.

Add a reset control that restores the original widths.

Colour comes only from CSS custom properties: var(--raised), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Make table columns resizable by dragging a handle in the header.

Left the table on automatic layout, so every width change reflowed the other columns and the content jumped around under the pointer — the column being dragged did not follow the cursor because the browser was renegotiating all the widths on every frame. The handle was also a div with no keyboard access, so the feature did not exist for keyboard users.

### Attempt 2

> Use table-layout fixed and make the handle keyboard accessible.

Fixed layout stopped the jumping, but the handle became a button, which put a tab stop between every pair of columns and announced itself as a button that does nothing when activated. Widths were also stored in a variable, so every reload threw away the arrangement the user had just spent time setting up.

## Why this one is worth keeping

One line — table-layout: fixed — is the difference between this working and not, and it is not discoverable by iterating on the drag code. The symptom is that the dragged column does not track the pointer, which reads as a maths bug and is actually the browser doing its normal job of balancing widths. Naming the property and the reason saves an afternoon.

The separator role matters more than it looks. A button between every pair of columns adds tab stops that announce an action and perform none; a separator with a value is understood by assistive technology as something adjustable, which is what it is.

Measuring once at drag start rather than reading the current width each frame is the standard defence against accumulated rounding in any drag-to-resize. Frame-by-frame deltas drift; a delta from a fixed origin cannot.
