# Adjust Last Action

- **Element ID:** `adjust-last-action`
- **Type:** modal
- **Live:** https://prism.shinzuu-dev.workers.dev/components/adjust-last-action
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/adjust-last-action.json

After an action runs, a panel shows that action's parameters. Change one and it silently re-runs from the state before it — so tuning a result never means undo, redo, guess again.

## Final prompt

```
Build an 'adjust last action' panel in plain HTML, CSS and vanilla JavaScript — the pattern where an action's parameters remain editable after it has run.

The rule that defines it: take a SNAPSHOT of the state before the action is first applied, and re-run from that snapshot every time a parameter changes. Never apply to the current state. Re-applying to the output compounds the effect — three nudges of a blur radius from 6 to 8 produce a blur of 21 — and leaves no way back to the original.

Write the action as a PURE function of (snapshot, params) returning the new state, reading nothing from the live DOM. That purity is what makes re-running safe, and it is what a version applying deltas to the DOM cannot offer.

The panel appears only AFTER the action, never before. Parameters are meaningless until the result is visible: a modal asking for a blur radius up front makes the user guess, and it covers the canvas they would need to judge it on.

The panel must not block the canvas. This is not a modal dialog in the <dialog> sense, despite the type — it is a non-blocking panel, and being able to see the artwork while adjusting is the entire point.

Committing any unrelated action invalidates the snapshot, so close the panel and say the result is now committed rather than leaving stale controls that would re-run from a state that no longer exists.

Show which run number is current and state explicitly that it re-ran rather than stacked, so the behaviour is observable.

Respect prefers-reduced-motion on the preview transition. Use tokens only: var(--accent), var(--accent-fg), var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Add a settings dialog so the user can configure the blur before applying it.

A dialog before the action asks the user to choose a radius for an effect they have not seen. They apply it, dislike it, undo, reopen, guess again. The parameters matter only in the presence of the result, and a modal that blocks the canvas hides the one thing needed to choose them.

### Attempt 2

> Keep the parameters adjustable after the action, re-applying when they change.

Re-applied to the CURRENT state instead of the state before the action. Every slider movement compounded on the last result — dragging the radius from 6 to 7 to 8 produced a blur of 21, and there was no way back to the original short of undoing repeatedly. The action must re-run from a snapshot taken before its first application.

## Why this one is worth keeping

Two ideas, and the second is the one that gets implemented wrong. The first is ordering: parameters are worth choosing only once you can see what they did, so a configuration dialog before the action forces a guess and then hides the evidence. The second is that 'keep it adjustable' silently means 'keep it re-runnable from before', and applying to the current state instead is an easy mistake that produces compounding output — each adjustment looks like it worked, and the drift only becomes obvious several nudges in, by which point the original is unreachable. Writing the action as a pure function of a snapshot makes the correct behaviour the only one available.
