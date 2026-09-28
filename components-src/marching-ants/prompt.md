# Marching Ants Wait

- **Element ID:** `marching-ants`
- **Type:** loader
- **Live:** https://prism.shinzuu-dev.workers.dev/components/marching-ants
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/marching-ants.json

A dashed outline crawls the actual perimeter of whatever is loading — a row, a card, a notched shape — instead of a spinner parked in the middle. The crawl is pure CSS.

## Final prompt

```
Build a marching-ants loading outline in plain HTML and CSS, with the animation entirely in the stylesheet.

The outline must trace the real border box of whatever element is busy — a list row, a card, an irregular shape — so the indication is attached to the thing that is loading rather than floating over it.

Register the rotation angle with @property, syntax "<angle>", inherits false, initial-value 0deg. This is the step that makes it work: an unregistered custom property is an untyped string, and strings do not interpolate, so animating one jumps from start to end with no motion at all. Registering it gives the engine a type it can tween.

Draw the ants as a repeating-conic-gradient whose from angle is that property, used as the second layer of background-image. Layer a solid fill of the surface colour above it, then set background-origin: border-box with background-clip: padding-box, border-box, so the gradient is confined to the transparent border while the element keeps its own fill. Painting the gradient without that clip erases the background.

Drive the state from aria-busy on the element itself rather than a class, so the visual state and the announced state cannot drift apart. Select on [aria-busy="true"] for the animation.

Include one deliberately irregular element — a scooped or notched corner — to show the ants follow the border box rather than a rectangle drawn on top.

Announce through a single role="status" region, once per item completing, never per animation frame.

Under prefers-reduced-motion: reduce, stop the crawl and leave the dashed outline static, keeping aria-busy so the state is still conveyed.

Colour comes only from CSS custom properties: var(--surface), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a loading indicator that outlines the element being loaded with a marching-ants border.

Animated border-style: dashed with a changing dash offset, which does nothing — border dashes are not addressable and the property is not interpolable. Fell back to a spinner absolutely positioned in the centre of each row, which is the thing the component was supposed to replace and tells the user nothing about which element is busy.

### Attempt 2

> Use a conic gradient as a border image and animate its angle.

Set the angle in a plain custom property and animated it. Nothing moved: an unregistered custom property is a string to the animation engine, and strings do not interpolate — it jumped from start to end with no steps between. The gradient was also painted over the element's background, so the fill disappeared and only the border ring survived.

## Why this one is worth keeping

The @property registration is the entire lesson and it is invisible in the failing code. Animating an unregistered custom property produces no error, no warning, and no motion — the value simply snaps. Developers reasonably conclude the technique does not work and reach for an SVG ring instead. Saying explicitly that an unregistered property is a string, and strings do not interpolate, converts a mystery into a one-line fix.

The background-clip pair is the second invisible requirement: the gradient must live in the border box while the fill stays in the padding box, or the element loses its background entirely. Both halves have to be stated together because fixing one without the other still looks broken.

Driving the animation from aria-busy rather than a class is worth keeping as a habit. When the selector and the announcement read the same attribute, a component cannot end up looking busy while telling assistive technology it is finished.
