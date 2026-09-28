# History Scrubber

- **Element ID:** `history-scrubber`
- **Type:** modal
- **Live:** https://prism.shinzuu-dev.workers.dev/components/history-scrubber
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/history-scrubber.json

Drag back through versions and see each one applied live before committing. Scrubbing previews, restoring truncates, and editing the past is blocked rather than silently branching.

## Final prompt

```
Build a version history scrubber in plain HTML, CSS and vanilla JavaScript, no dependencies.

A range input walks a list of versions; the content area shows the version at the current position.

Scrubbing previews, it never commits. Bind preview to the input event and treat the change event as settling the position. Committing on every movement means dragging across version two to reach version one destroys the versions in between, which makes the control useless for exploring.

Restoring is an explicit action with its own button, shown only while the position is in the past.

Editing while scrubbed to an earlier version is the case that is always mishandled. Do not silently branch and do not silently discard. Disable the input while the position is in the past, and change its placeholder to say the version must be restored before editing from there, so the state explains itself rather than failing on submission.

When restoring, truncate the future rather than branching — one timeline is far easier to reason about than a tree — and state how many later versions were discarded, by count, in the announcement.

Mark the content area visibly when showing a past version so it is never mistaken for the current one.

Format relative times with Intl.RelativeTimeFormat and no locale argument, switching from minutes to hours past sixty minutes.

Announce position changes through a role="status" region as version N of M with its label, not on every scrub frame.

Colour comes only from CSS custom properties: var(--bg), var(--surface), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build an undo history you can scrub through with a slider.

Every movement of the slider committed that state, so dragging past version two to reach version one destroyed everything after whichever position the pointer happened to cross. Scrubbing is exploration; committing on every frame of an exploration makes the control unusable for the thing it is for.

### Attempt 2

> Make scrubbing a preview and add a restore button.

Preview and restore were separated correctly, but typing a new edit while scrubbed to an earlier version silently discarded every later version with no warning, and the input stayed enabled, so there was nothing to suggest the edit would be destructive. It also never said how many versions had been lost.

## Why this one is worth keeping

The input-versus-change distinction is the whole component and it is one line of difference. Input fires continuously during a drag; change fires when the drag settles. Binding a destructive commit to input turns exploration into demolition, and it is an easy mistake because both events look interchangeable in a handler.

The edit-while-scrubbed case is the interesting one. There are three plausible behaviours — branch, truncate, refuse — and a model will pick whichever is easiest, which is truncate, and do it silently. Choosing refuse, and making the refusal visible in the control's own state rather than in an error after the fact, is what makes the component feel considered.

That is the general rule: when an action in an unusual state would destroy something, disable it and say why in place, rather than allowing it and apologising afterwards.
