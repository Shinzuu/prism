# Sliding Pane Stack

- **Element ID:** `sliding-pane-stack`
- **Type:** navbar
- **Live:** https://prism.shinzuu-dev.workers.dev/components/sliding-pane-stack
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/sliding-pane-stack.json

Opening a link pushes a new pane to the right instead of replacing the view. Older panes collapse to vertical spines you can click to come back, so the path you took never leaves the screen.

## Final prompt

```
Build a multi-level navigation that pushes panes sideways, in plain HTML, CSS and vanilla JavaScript.

Clicking an item appends a new pane to the right rather than replacing the current view. Keep the last two panes at full width — the one you are in, and the one you came from — and collapse everything older to a narrow SPINE about 2rem wide, with its title rotated using writing-mode: vertical-rl.

A collapsed pane must stay a real control: focusable, with role="button", an aria-label saying which pane it reopens, and Enter and Space handled as well as click. Do not use display: none on it — an invisible, inert strip is just a gap, and the trail is the entire reason for this pattern. Clicking a spine drops every pane after it and returns you there.

Animate the collapse by transitioning width, and scroll the rail to the new pane with scrollTo({behavior:'smooth'}) inside requestAnimationFrame — scrolling in the same tick as the insertion targets the pre-layout scrollWidth and lands short.

Use scroll-snap-type: x proximity with scroll-snap-align: end on the panes, and overscroll-behavior-x: contain so a horizontal flick does not trigger the browser's back gesture.

Keep the pane stack derived from a level index stored on each pane, so reopening from a spine is a single truncation rather than bookkeeping. Set aria-expanded on the item that opened each pane. Under prefers-reduced-motion drop the width transition and use instant scrolling.

Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a column navigation where clicking an item opens the next level in a new column.

New columns pushed the earlier ones off the left edge, out of the scroll area. The trail was technically still in the DOM but unreachable without scrolling backwards, which is the same problem as a drill-down that replaces the view — the reason to stack panes at all is that the path stays visible.

### Attempt 2

> Collapse the older columns so they stay on screen as narrow strips.

Collapsed with display: none on the body and a fixed narrow width. The strips were then invisible and inert — nothing indicated what they were or that they could be clicked. A collapsed pane has to remain a labelled, focusable control, or it is just a gap.

## Why this one is worth keeping

Everything here turns on the collapsed state being a control rather than a decoration. The pattern's whole claim is that your path stays on screen, and the two natural implementations both destroy it: letting old panes scroll away, or collapsing them with display: none. A spine you can see, focus, label and click is what makes the stack navigable instead of merely wide. The timing detail is worth knowing too — scrolling to a pane in the same tick you insert it reads the old scrollWidth and lands short, so the scroll has to wait a frame.
