# Slide to Confirm

- **Element ID:** `slide-confirm`
- **Type:** button
- **Live:** https://prism.shinzuu-dev.workers.dev/components/slide-confirm
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/slide-confirm.json

A destructive action that needs a sustained drag, with a keyboard path that is equally deliberate — hold the arrow key — rather than a single Enter that defeats the point.

## Final prompt

```
Build a slide-to-confirm control in plain HTML, CSS and vanilla JavaScript, no dependencies, for a destructive action.

The premise is that confirmation must be deliberate, so every decision follows from that.

Require the grip to reach at least 92 percent of the rail. Below that, releasing always springs the grip back to zero and fires nothing. There is no partial commit.

Call setPointerCapture on pointerdown so a fast drag that leaves the rail still tracks; without it, overshooting the end reads as a cancelled gesture, which is the most frustrating possible failure for this control.

The keyboard path must be equally deliberate. Do not map Enter to confirm. Arrow Right advances the grip by a small step per key repeat, so holding the key is the keyboard equivalent of holding the drag, and releasing before the threshold springs it back. Arrow Left retreats, Home resets, Escape cancels. End may jump to the threshold and confirm, as an explicit accelerator for people who cannot hold a key.

Mark the control as role="slider" with aria-valuemin, aria-valuemax and a live aria-valuenow, and give it an aria-label that states both the gesture and the keyboard alternative.

The spring-back transition must only exist while settling, never while dragging, or the grip will lag behind the pointer. Toggle it with a data attribute around the settle.

Recompute the travel on resize, since the rail width defines the geometry.

Announce the outcome through a role="status" element and emit a bubbling CustomEvent named sl:confirm. Reset after a couple of seconds so the demo can be repeated.

Colour comes only from CSS custom properties: var(--bg), var(--raised), var(--border), var(--text), var(--text-dim), var(--accent), var(--accent-fg). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a slide-to-confirm button for a destructive action.

Fired at 50% of the rail and left the grip wherever the user let go, so an accidental nudge past the middle deleted something and the control gave no way to back out mid-gesture. Dragging outside the rail stopped the movement entirely because there was no pointer capture, so a fast drag beyond the end registered as a partial one and cancelled.

### Attempt 2

> Require a full slide and add keyboard support.

Keyboard support was Enter to confirm, which throws away the entire premise: the control exists to make confirmation deliberate, and a single keypress is less deliberate than the button it replaced. Arrow keys moved the grip but a single press could land past the threshold and fire immediately.

## Why this one is worth keeping

The keyboard instruction is the whole lesson. Asked for keyboard support on a deliberate-gesture control, a model reaches for the simplest equivalent — Enter — which is exactly the thing the component was built to avoid. The fix is not to ask for better accessibility but to restate the premise inside the keyboard requirement: the keyboard path must be equally deliberate, therefore hold, not press.

The transition detail is small and worth keeping. A CSS transition on the dragged property makes the grip lag the pointer, which feels broken, while removing it entirely loses the spring-back. Scoping the transition to a settling state with a data attribute is the standard answer to that whole class of problem.

And again: setPointerCapture. Third component in this library to need it, third time it would have shipped broken without being named.
