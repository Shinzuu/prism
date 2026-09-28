# Peel Corner Card

- **Element ID:** `peel-corner-card`
- **Type:** card
- **Live:** https://prism.shinzuu-dev.workers.dev/components/peel-corner-card
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/peel-corner-card.json

Grab the corner and the paper peels back — curled, self-shadowed, showing its own reverse — then commits or springs shut depending on how far you took it. One clip-path drives the face, the fold and the curl together.

## Final prompt

```
Build a card whose bottom-right corner peels back under a drag, in plain HTML, CSS and vanilla JavaScript.

Drive the whole effect from ONE custom property, --pc-peel, a number from 0 to 1. Everything derives from it:
- The face carries clip-path: polygon(...) that removes exactly the triangle the fold exposes.
- The curl is a square sized from the same value, clipped to a triangle, sitting over that gap.
- A reverse layer sits beneath the face with real content on it, so the peel uncovers something worth uncovering rather than a flat colour.
Deriving the fold twice is the mistake to avoid: the curl and the face must be computed from the same number or they disagree at most positions and leak background through the fold.

Call CSS.registerProperty for --pc-peel with syntax '<number>' before any transition depends on it. This is mandatory, not tidiness: an unregistered custom property is a string, so it flips 0 to 1 with no intermediate values. transition: --pc-peel is accepted silently and does nothing, which looks like a bad easing curve rather than a missing registration. Wrap the call in try/catch, because registering the same name twice throws and multiple instances may share a page.

Give the curl a linear-gradient running along the fold's normal (a 315deg gradient for a bottom-right corner) so the half nearest the fold reads as lit underside and the far half falls into shadow, plus a soft box-shadow offset back toward the card. That gradient is what makes it read as paper rather than a cut triangle.

Use Pointer Events with setPointerCapture so the drag survives leaving the element, and touch-action: none on the handle so it does not fight the page scroll. Map the pointer to the peel with the mean of the horizontal and vertical distances from the corner. Remove the transition while dragging and add it only on release, so the card tracks the pointer exactly and eases only when let go. On release, commit past halfway and spring shut below it — two end states, no middle.

The handle must be a real <button> at least 44px square, with aria-expanded reflecting the state and arrow keys, Enter and Escape driving the same two states. Use tokens only: var(--raised), var(--bg), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours. Honour prefers-reduced-motion by collapsing the settle to near-instant.
```

## What failed first

### Attempt 1

> Build a card whose corner peels back when you drag it, revealing content underneath.

Used a rotated pseudo-element for the curl and a separate clip-path on the face. The two were computed independently, so at most drag positions the curl overlapped the face or left a wedge of background showing through the fold. The fold is one line; deriving it twice guarantees they disagree.

### Attempt 2

> Drive the face clip and the curl from one shared variable, and animate the release.

Geometry was right and the release did not animate. --pc-peel was never registered, so the engine treats it as a string: it jumps from 0 to 1 with no interpolation. transition: --pc-peel is accepted, throws nothing and silently does nothing, which reads as a broken easing curve rather than a missing registration.

## Why this one is worth keeping

Two failures here are invisible in the code. The first is deriving the fold line twice — once for the face clip, once for the curl — which looks correct at 0 and 1 and comes apart everywhere in between, exactly where a drag spends its time. The second is the missing CSS.registerProperty: transitioning an unregistered custom property is silently a no-op, so the geometry works, the release snaps, and nothing anywhere says why. The detail that sells the effect is the gradient direction on the curl. Run it along the fold's normal and it reads as paper catching light; run it any other way and it reads as a triangle someone pasted on.
