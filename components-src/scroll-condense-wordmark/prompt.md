# Scroll Condense Wordmark

- **Element ID:** `scroll-condense-wordmark`
- **Type:** navbar
- **Live:** https://prism.shinzuu-dev.workers.dev/components/scroll-condense-wordmark
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/scroll-condense-wordmark.json

The wordmark compresses on the font's width axis as the page scrolls — narrowing rather than shrinking, so the letterforms keep their height and stroke weight while the bar keeps its size.

## Final prompt

```
Build a header whose wordmark condenses as a panel scrolls, in plain HTML, CSS and vanilla JavaScript.

Drive the font's wdth axis through font-variation-settings. Do NOT use transform: scale or scaleX. scale makes the mark recede rather than condense — x-height and stroke weight shrink with it — and scaleX squashes the outlines, thinning the vertical stems while leaving the horizontals at full weight, which destroys the stroke contrast. A condensed cut is a different drawing of the letterform, and only the width axis gives you that.

Self-host a variable font carrying both wdth and wght, declared with a component-scoped @font-face and explicit font-weight and font-stretch ranges. MEASURE the axis before committing to a face: render one string at each end of the width range and compare. Nominal range is not effect size — Roboto Flex spans 25 to 151 and narrows the same string to only 0.79 of its widest, while Archivo spans 62 to 125 and reaches 0.53. The wider-sounding axis condenses less. Raise the weight slightly as the width falls, which is what a designer does by hand to keep the mark's colour even as it narrows.

Throttle the scroll handler with requestAnimationFrame and register it passive. Writing styles on every scroll event forces layout far more often than the display can show.

Keep the bar's height fixed so nothing reflows while scrolling — only the mark's proportion changes.

Clamp the axis at the font's designed minimum rather than an arbitrary number; pushing an axis past its range is clamped silently and you lose the ability to tell the difference between 'at the limit' and 'not applied'.

Under prefers-reduced-motion, hold the wide setting and say so rather than animating.

Show the live axis values and the measured mark width, so the effect is legible as numbers. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--display), var(--sans), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Shrink the site wordmark as the user scrolls down, like a condensing header.

Scaled it with transform: scale(). The mark did not condense, it receded — x-height, stroke weight and letter spacing all shrank together, so it read as the same logo further away rather than as a compact version of itself. It also went soft, because a scaled glyph is a resampled outline rather than a hinted rendering at the new size.

### Attempt 2

> Use transform: scaleX() so it narrows without getting shorter.

This is the mistake a type designer would catch immediately. scaleX squashes the existing outlines, so the vertical stems get thinner while the horizontals keep their weight — the letters lose their stroke contrast and start to look like a photocopy stretched sideways. A real condensed cut is a different drawing, not a compressed one.

## Why this one is worth keeping

This is a case where the naive implementation is not merely imprecise but typographically wrong in a way that is hard to unsee once pointed out. scaleX applies a uniform horizontal squash to outlines that were drawn with deliberate stroke contrast, so the vertical stems thin while the horizontal bars stay put and the letterforms lose the rhythm that made them legible. The width axis exists precisely because condensing type is a redrawing problem, not a geometry problem — the designer has already decided how each letter should narrow. Reaching for a transform is choosing to override that judgement with a matrix multiply.
