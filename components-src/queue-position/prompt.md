# Queue Position

- **Element ID:** `queue-position`
- **Type:** loader
- **Live:** https://prism.shinzuu-dev.workers.dev/components/queue-position
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/queue-position.json

Not a spinner: your place in line, how fast the line is actually moving, and an estimate derived from that rate — which it withholds when the rate is too unstable to predict from.

## Final prompt

```
Build a queue position indicator in plain HTML, CSS and vanilla JavaScript, no dependencies. This replaces a spinner, so it must tell the user something a spinner cannot.

Show three things: the current position, the observed rate at which the line is moving, and an estimate of the remaining wait derived from that rate.

Compute the rate over a rolling window of the last five observations rather than the most recent gap, so it does not swing wildly between ticks.

The most important requirement: know when not to give an estimate. Compute the coefficient of variation of the gaps between movements — the standard deviation divided by the mean — and when it exceeds roughly 0.55, or when fewer than four samples exist, say the line is moving unevenly and no reliable estimate is available yet. Do not show a number you are about to contradict. A confidently wrong estimate is worse than no estimate because the user plans around it.

Render the estimate in human units: seconds under a minute, whole minutes under an hour, then hours to one decimal. Never show raw seconds for a twenty minute wait.

The track is a real progressbar with aria-valuemin, aria-valuemax, aria-valuenow and a label, plus a marker showing where the user sits on it.

Announce through a role="status" element at milestones only — position 25, 10, 5 and next — not on every tick. A queue that announces every movement is unusable with a screen reader.

Simulate movement irregularly, with occasional ticks where the line does not move at all, because a perfectly regular queue is the case this component is not built for.

Under prefers-reduced-motion: reduce, remove the transitions on the fill and the marker.

Colour comes only from CSS custom properties: var(--raised), var(--border), var(--text), var(--text-dim), var(--accent). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a loading component that shows queue position.

A number and a spinner. The number changed, the spinner turned, and neither told you anything you could act on: no sense of whether the line was moving, how fast, or how long it might take. That is the failure of every spinner, reproduced with a figure next to it.

### Attempt 2

> Add an estimated wait time.

Computed the estimate from the single most recent gap between movements, so it swung between two minutes and forty minutes on consecutive ticks and was never twice the same. It also presented every estimate with equal confidence, including at the very start when there was one data point and no basis for any number at all. A confidently wrong estimate is worse than none, because the user plans around it.

## Why this one is worth keeping

The instruction that made this component worth building is the one telling it to refuse. Models produce estimates because an estimate is what was asked for, and the honest answer — the data does not support one yet — has to be specified as an outcome or it never appears.

Giving it a concrete threshold mattered more than describing the feeling. "Coefficient of variation above 0.55" is testable; "when the estimate seems unreliable" is not, and would have produced a vague heuristic or nothing.

The milestone-announcement rule is the same idea applied to assistive technology. The instinct is to wire the live region to the value and let it announce, which produces an unusable stream. Naming the four points where an announcement is actually useful is both simpler to implement and better to use.

General lesson: when a component reports on something uncertain, specify what it does when it does not know. That branch is where the honesty lives, and it is never volunteered.
