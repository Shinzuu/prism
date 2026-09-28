# Switch Scanning Menu

- **Element ID:** `switch-scanning-menu`
- **Type:** section
- **Live:** https://prism.shinzuu-dev.workers.dev/components/switch-scanning-menu
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/switch-scanning-menu.json

A bar of light walks the groups; one key drops inside and walks the items, with a countdown ring showing exactly how long is left before the scan moves on.

## Final prompt

```
Build a menu operable by a single switch input, in plain HTML, CSS, SVG and vanilla JavaScript.

Use TWO-LEVEL scanning: a highlight walks the groups on a timer; the switch enters the highlighted group; the highlight then walks that group's items; the switch selects. Flat scanning over every item is what makes single-switch use exhausting — eleven items at 1.4s each is fifteen seconds to reach the last, and a miss costs the whole cycle.

Show a COUNTDOWN RING for the remaining dwell time, animated with requestAnimationFrame. This is not decoration: without it the user cannot tell whether they have two seconds or two hundred milliseconds, so they press early and select the wrong item or hesitate and miss the window. It is the difference between a usable interface and a guessing game.

Make the dwell time adjustable and show the value. It is the single setting that must be tuned per person, and a hardcoded dwell makes the component unusable for anyone whose timing differs from the author's.

Give the group highlight and the item highlight visually DISTINCT treatments, so the current level is never ambiguous.

Provide an escape from a group without selecting, since entering the wrong group otherwise forces the user to select something they do not want.

Bind the switch to Space and Enter on a focusable container, and also expose an on-screen button so the behaviour can be tried with a pointer. Put the current position in an aria-live region.

Stop the timer when the component leaves the viewport — a scan nobody can see is only draining the battery.

Use tokens only: var(--accent), var(--accent-fg), var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a menu that can be operated with a single switch input.

Scanned every item in one flat list. With eleven items and a 1.4 second dwell, reaching the last one takes over fifteen seconds, and missing it means waiting for the whole cycle again. Flat scanning is what makes single-switch interfaces exhausting; grouping turns eleven steps into at most three plus three.

### Attempt 2

> Scan groups first, then items within the selected group.

Correct structure, unusable timing, because nothing showed how much time was left. The user cannot see when the highlight will move, so they press early and select the wrong thing, or hesitate and miss the window entirely — and a missed selection costs a full cycle. The dwell was also hardcoded, which is the one setting that must be adjustable per person.

## Why this one is worth keeping

Switch scanning is a whole interaction model most developers have never had to build, and its constraints invert the usual ones: there is no pointer, no direction, and only one bit of input, so the interface's job is to offer choices in an order the user can predict and wait for. The grouping is a genuine algorithmic improvement — two levels turn a linear search into something closer to logarithmic — but the countdown ring is the part that decides whether the thing is usable at all. An interface driven by a timer that the user cannot see is asking them to guess, and every wrong guess costs a full cycle. Making the dwell adjustable follows from the same observation: the correct timing is a property of the person, not of the design.
