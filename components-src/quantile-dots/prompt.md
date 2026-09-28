# Quantile Dots

- **Element ID:** `quantile-dots`
- **Type:** chart
- **Live:** https://prism.shinzuu-dev.workers.dev/components/quantile-dots
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/quantile-dots.json

A hundred outcomes drawn at evenly spaced quantiles, so the chance of missing a deadline is something you count rather than read off a shaded band. Drag the deadline and the count follows.

## Final prompt

```
Build a quantile dotplot in plain HTML, CSS and vanilla JavaScript, no dependencies and no chart library.

Draw one hundred dots representing predicted outcomes, binned into about twenty columns and stacked upward, with a draggable deadline that recolours every dot falling before it.

Place the dots at evenly spaced quantiles — the value at (i + 0.5) / 100 for i from 0 to 99 — not at random samples. Random draws give a different picture on every load and, at a hundred points, visibly misrepresent the tails, which is the region the whole chart exists to communicate. Implement the inverse normal CDF directly; Acklam's rational approximation is about fifteen lines and accurate far beyond what dot placement needs.

Use exactly one hundred dots so counting is trivial and the readout can say "N of 100" without the reader doing arithmetic.

The sentence is the component and the dots are how the reader checks it: state "N of 100 outcomes arrive by day X" in text, updating as the deadline moves. A picture that needs the reader to estimate a proportion has not finished the job.

Give the plot role="img" with an aria-label carrying that same count, and ship a visually hidden table of the underlying quantiles with a caption, because a chart is a picture of a table.

Use tabular-nums on every figure so the count does not jitter while dragging.

Colour comes only from CSS custom properties: var(--border) for outcomes past the deadline, var(--accent) for those before it, plus var(--text), var(--text-dim). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Show the uncertainty in a predicted arrival date.

Drew a line with a shaded confidence band around it. That is the conventional answer and people read it wrongly in a specific way: they take the band's edge as a hard bound and the centre line as the answer, which is exactly backwards. It also gives no way at all to answer the only question anyone has — what are the chances this misses Friday.

### Attempt 2

> Use a quantile dotplot of 100 outcomes instead.

Drew 100 random samples from the distribution, so the picture changed on every reload and at 100 draws it visibly misrepresented the tails — sometimes five dots past the deadline, sometimes fifteen, for the same underlying prediction. The dots were also drawn in a canvas with no text equivalent, so the entire estimate was invisible to assistive technology.

## Why this one is worth keeping

This component exists because of a finding from the uncertainty-visualisation literature: people reason correctly about countable outcomes and incorrectly about shaded bands. A band invites the reader to treat its edge as a guarantee; a hundred dots invite them to count the ones that miss. The chart is an argument about honesty, not a prettier bar.

The quantile-versus-random distinction is the instruction that mattered most, and it is counterintuitive — sampling sounds more principled than spacing. Stating the consequence, that random draws misrepresent the tails at n=100 and change on every reload, is what made the choice obvious.

And the rule that has now recurred across four charts in this library: the sentence is the component, the picture is how you check it. Any chart that requires the reader to estimate a proportion by eye has left its job unfinished.
