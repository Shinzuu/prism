# Progressive Blur Sheet

- **Element ID:** `progressive-blur-sheet`
- **Type:** modal
- **Live:** https://prism.shinzuu-dev.workers.dev/components/progressive-blur-sheet
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/progressive-blur-sheet.json

The scrim behind the sheet is not a flat dim but a blur that deepens toward the sheet edge, built from four masked layers. Opens, closes, traps focus and handles Esc with no JavaScript at all.

## Final prompt

```
Build a bottom-sheet modal in plain HTML and CSS whose backdrop is a progressive blur — sharp at the far edge, deepest where it meets the sheet.

Key constraint, which is the whole component: backdrop-filter takes a single radius. You cannot gradient it, and masking one blurred layer only fades that layer out, revealing the un-blurred page rather than a lighter blur. Build it as FOUR stacked absolutely-positioned layers instead. Each layer blurs the whole backdrop at a progressively larger radius (roughly 2px, 6px, 14px, 28px), and each carries a mask-image: linear-gradient(to bottom, transparent <start>, black <start + 24%>) with a later start than the one below it. Because a stronger blur is always composited over a weaker one, the visible radius ramps smoothly instead of stepping. Drive the radius and the mask start from custom properties set inline per layer so the ramp is legible in the markup.

Use a real <dialog> opened with commandfor + command="show-modal" and closed with command="close", so focus trapping, Esc, inertness and focus return all come from the platform with no script. Set the dialog itself to fill the viewport with a transparent ::backdrop — the layered veil is doing that job, and ::backdrop cannot be stacked.

Put real content behind the sheet — a heading, text, a small bar chart — so the blur has something to act on; an empty background makes the effect invisible.

Include the -webkit- prefixed backdrop-filter and mask-image alongside the standard ones. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--accent-fg). No literal colours. The sheet rises with a short transform animation that is removed under prefers-reduced-motion.
```

## What failed first

### Attempt 1

> Build a bottom sheet modal with a blurred background behind it.

One backdrop-filter: blur(20px) across the whole scrim. It reads as frosted glass laid flat over the page — the same radius at the top of the screen as against the sheet edge — which is the look every framework ships and the reason the effect has stopped signalling depth at all.

### Attempt 2

> Build a bottom sheet whose backdrop blur increases smoothly toward the sheet.

Tried backdrop-filter: blur(linear-gradient(...)) and then a single layer with a mask over it. Neither works. A filter takes one radius for the whole element, and masking one blurred layer only fades that layer's opacity — the blur radius stays constant while the layer disappears, so the sharp page shows through rather than a weaker blur.

## Why this one is worth keeping

Two things in here fail silently and both look like the effect simply not working. First, a masked blur layer does not produce a weaker blur — it produces less of that layer, so the sharp page shows through underneath and the result looks broken rather than graduated. The fix is to stack layers so a stronger blur always sits over a weaker one, which is unintuitive enough that most attempts never reach it. Second, ::backdrop cannot be layered, so the pseudo-element everyone reaches for is a dead end and the veil has to live inside the dialog. What makes the component worth the trouble is that everything else — Esc, focus return, inertness, the top layer — is free, so the entire file is presentation.
