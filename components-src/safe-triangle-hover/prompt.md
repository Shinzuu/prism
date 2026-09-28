# Safe Triangle Hover

- **Element ID:** `safe-triangle-hover`
- **Type:** button
- **Live:** https://prism.shinzuu-dev.workers.dev/components/safe-triangle-hover
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/safe-triangle-hover.json

Draws the wedge your pointer is allowed to travel through on the way to the submenu, so moving diagonally does not close the panel you are heading for — with a switch to feel it without.

## Final prompt

```
Build a menu whose submenu panel does not close while the pointer is travelling toward it, in plain HTML, CSS, SVG and vanilla JavaScript.

Use the safe-triangle technique, not a timeout. When the pointer leaves the active menu item, build a triangle from three points: the pointer's exit position, and the panel's two NEAR corners (top and bottom of the edge facing the menu). While the pointer is inside that triangle, ignore hover on other menu items entirely — it is still on a plausible path. Leaving the triangle without reaching the panel closes immediately, with no delay at all.

Explain in a comment why a timeout is the wrong tool: too short and it still closes, too long and every intentional move stalls, and the right value depends on the individual's pointer speed, so there is no correct number.

Test point-in-triangle with the sign of the three cross products — a bounding box is not enough, since the whole value is in the diagonal edges.

DRAW the triangle as an SVG overlay with pointer-events: none, and give the user a switch to hide it and another to disable the mechanism entirely. The effect is invisible when it works, so being able to turn it off is how a reviewer understands what it does.

Hover is not available to keyboard or touch users: open the panel on focus, close on Escape, and set aria-haspopup and aria-expanded on the items.

Use logical properties so the menu mirrors in RTL, and note that the near corners then face the other way. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a menu where hovering an item opens a submenu panel beside it.

Opening on hover and closing when the pointer leaves the item means the panel closes on the way to itself. The panel is to the right, so reaching it requires a diagonal, and a diagonal crosses the item below — whose hover immediately swaps the panel. The menu is unusable with a mouse and perfect with a trackpad moving in straight lines, which is why it passes casual testing.

### Attempt 2

> Add a delay before closing so the pointer has time to reach the panel.

A timeout trades one bug for a worse feel. Too short and the panel still closes; too long and every deliberate move to another item stalls, so the whole menu feels laggy and unresponsive. The delay also has to be tuned to pointer speed, which varies per person and per device — there is no correct number.

## Why this one is worth keeping

This is the rare interaction bug where the naive implementation is unusable and still ships, because it works whenever the pointer happens to travel in a straight line — which is exactly what a developer does when deliberately testing their own menu. The instructive part is that the obvious fix is also wrong: a close delay cannot be tuned, because the correct value is a property of the individual's hand, not of the interface. Replacing a timing heuristic with a geometric one removes the tuning problem entirely — the question 'is this pointer plausibly heading for the panel' has an exact answer, and once you ask it that way the delay disappears and the menu becomes instant in both directions.
