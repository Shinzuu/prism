# The hero drawing

Two drawings of the same aircraft, to the same numbers.

- `src/components/Hero.astro` holds an SVG general-arrangement sheet: side
  elevation, plan view, front elevation, dimensions, title block. It is what
  renders with no JavaScript and no WebGL, and it is what a printer gets.
- `src/components/hero/` is a React island that draws the aircraft in 3D as a
  hidden-line wireframe and animates it. When it comes up it fades the SVG out;
  the SVG stays in the document.

## Where the numbers live

`spec.ts` and nowhere else. Length 19.10 m, span 19.54 m at 20° sweep and
11.65 m at 68°, height 4.88 m.

The wing pivot is **solved, not placed**. Two published spans give two
equations; subtracting them removes the pivot and yields the panel length,
which then gives the pivot station:

```
pivot + panel·cos(20°) = 19.54 / 2
pivot + panel·cos(68°) = 11.65 / 2
→ panel = 6.981 m, pivot = 3.210 m from the centreline
```

Place the pivot by eye instead and one of the two spans is wrong, so the title
block quotes a figure the wings disagree with. `test/hero.mjs` checks both.

## Tuning knobs

| Knob | Where | What it does |
|---|---|---|
| `CREASE_DEG` (18) | `Airframe.tsx` | Edge extraction angle. Lower turns the lofted body into triangle soup; higher loses panel lines. |
| `DRAW_SECONDS` (2.6) | `Airframe.tsx` | How long the aircraft takes to draw itself nose to tail. |
| `SWEEP_SECONDS` (2.2) | `Airframe.tsx` | One direction of the 20° → 68° sweep. |
| `IDLE_YAW_DEG` (5) | `Airframe.tsx` | Amplitude of the idle turntable. |
| `PARALLAX_DEG` (3) | `Airframe.tsx` | How far the pointer can push the camera. |
| `DPR_CAP` (2) | `Airframe.tsx` | Upper bound on device pixel ratio. |
| `linewidth` (1.4 / 1.0) | `ink.ts` | Visible and hidden line weights, in pixels. |
| `opacity` (1 / 0.18) | `ink.ts` | Visible and occluded ink. |
| `STATIONS` | `spec.ts` | Fuselage cross-sections. `flat` is the superellipse exponent: 2 is an ellipse, 6 is nearly a box. |

## Colour

No colour is written in any of these files. `token()` reads a CSS custom
property and resolves it by painting one pixel and reading it back.

| Token | Used for |
|---|---|
| `--text` | visible ink, callout leaders |
| `--text-dim` | occluded (hidden) lines |
| `--accent` | callout numbers, dimension line and tips, the span readout |
| `--bg` | published alongside the ink so the test can check they separate |

The paint-and-read-back step is not decoration. The palette is OKLCH, and
three's `Color.set()` understands hex, `rgb()`, `hsl()` and the named colours
and nothing else. Handed `oklch(...)` it leaves the material at its default,
which is white, and every line disappears into the page with no error.

## What the tests learned the hard way

`test/hero.mjs` checks the ink colour by asking the component what the palette
resolved to. Three earlier versions of that check had no teeth:

1. `gl.readPixels` always read back empty. Without `preserveDrawingBuffer` the
   buffer is cleared once the frame is composited.
2. Comparing PNG file sizes scored white ink the same as black, because the
   drafting grid behind the drawing dominates the file.
3. Screenshotting the canvas alone failed the same way — the canvas has an
   alpha channel, so the shot is mostly the grid showing through it. White ink
   landed within seven pixels of black.

It also checks that the canvas is sized to the plate rather than to the
document. Astro scopes a component's styles by stamping an attribute on the
elements in its own template, and the island's nodes are made by React at
runtime, so a scoped rule reaches none of them. The island's CSS is therefore
global and every selector starts with `.af`.

## Budget

Measured on this build, gzipped:

| Chunk | Size |
|---|---|
| three (tree-shaken) | 115.3 KB |
| line addons | 3.0 KB |
| the island itself | under 4 KB |

`import * as THREE from 'three'` shipped 166 KB, because a namespace import is
opaque to the bundler and nothing can be dropped. `three-min.ts` re-exports the
fifteen symbols the drawing uses, and Rollup shakes out the rest.

The loop stops when the hero leaves the viewport (`IntersectionObserver`) and
when the tab is hidden. `prefers-reduced-motion` renders the finished drawing
once and never starts a loop.
