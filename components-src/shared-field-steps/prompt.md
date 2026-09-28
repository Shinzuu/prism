# Shared Field Steps

- **Element ID:** `shared-field-steps`
- **Type:** form
- **Live:** https://prism.shinzuu-dev.workers.dev/components/shared-field-steps
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/shared-field-steps.json

Between wizard steps the fields that persist glide to their new positions while only the genuinely new ones fade in, so the form reads as one form changing rather than three unrelated screens.

## Final prompt

```
Build a multi-step form where fields shared between steps move rather than re-appear, in plain HTML, CSS and vanilla JavaScript.

Define each step as a list of field keys, with several keys appearing on more than one step. On a step change:
1. FIRST — record each surviving field's position with getBoundingClientRect (NOT offsetTop, which ignores transforms and reads a stale origin if an animation is still running).
2. Re-render the step.
3. For fields that existed before, compute the delta and animate from translateY(delta) to none with element.animate().
4. For fields that are genuinely new, and ONLY those, run a short fade-and-rise.

A field that persists must never fade. Fading it says it went away and came back, which is precisely the wrong message for a value the user already provided. Do not animate fields whose position did not change either — that produces a shimmer on every step for no information.

Carry the entered values across steps and back, reading them out of the DOM before the re-render. A wizard that loses input on Back is worse than one with no animation at all.

Announce the step in an aria-live region as 'Step N of M — title'; the progress dots are decoration and should be aria-hidden.

Under prefers-reduced-motion, skip both the movement and the fade — but still keep the values and the ordering correct.

Use tokens only: var(--accent), var(--accent-fg), var(--bg), var(--raised), var(--text), var(--text-dim), var(--border). No literal colours.
```

## What failed first

### Attempt 1

> Build a multi-step form that animates between steps.

Cross-faded the whole panel. Fields present on both steps faded out and back in at a new position, which tells the user they were replaced — so a name they already typed appears to have been re-asked. The animation actively destroys the continuity that makes a wizard feel like one form.

### Attempt 2

> Keep the shared fields mounted and animate only their position.

Right idea, wrong measurement: used offsetTop for the before position. offsetTop ignores transforms, so stepping forward and immediately back read a stale origin while the previous animation was still running and the fields drifted. Also animated fields whose position had not changed at all, producing a shimmer on every step for no reason.

## Why this one is worth keeping

The useful idea is that an animation is a claim about what happened, and a cross-fade claims replacement. When a field carries a value the user typed two steps ago, claiming it was replaced is a lie the interface tells about its own state — and it is the default behaviour of every panel transition, which is why so many wizards feel like a sequence of unrelated screens. Splitting the transition by whether a field persists makes the motion say the true thing: these moved, that one is new. The measurement detail matters for the same reason as in any FLIP: offsetTop is blind to transforms, so it silently reports the wrong origin exactly when a user is clicking through steps quickly.
