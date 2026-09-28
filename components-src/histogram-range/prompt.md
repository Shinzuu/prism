# Histogram Range

- **Element ID:** `histogram-range`
- **Type:** chart
- **Live:** https://prism.shinzuu-dev.workers.dev/components/histogram-range
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/histogram-range.json

A two-thumb filter drawn over the distribution it filters, so you can see how many results each end of the drag will cost you before you let go.

## Final prompt

```
Build a histogram range filter in plain HTML, CSS and vanilla JavaScript, no dependencies.

Draw a histogram of the underlying distribution and put two thumbs on it. The chart is not decoration behind the control: bars inside the selected range are tinted with the accent and bars outside are not, updating live as a thumb moves.

State the cost of the current selection in words — how many of the total results fall inside the band, as a count and a percentage — and update it while dragging, so the user sees what an end of the drag will cost before committing to it. That sentence is the reason to build this instead of a plain range.

Thumbs must collide rather than swap. Clamp the low thumb at the high value and vice versa. A filter whose ends trade places produces a range nobody asked for.

Each thumb is role="slider" with its own aria-valuemin and aria-valuemax reflecting the other thumb's position, not the full domain, plus an aria-valuetext giving the formatted currency rather than a bare number.

Keyboard: arrows step by 5, Shift by 25, Home and End move to the nearest limit, which for the low thumb is the high thumb and vice versa.

Clicking the chart away from either thumb moves whichever is nearer to that point.

Call setPointerCapture on pointerdown so a drag that leaves the chart keeps tracking.

Format money with Intl.NumberFormat and no locale argument so it follows the user's locale.

Announce the result count through a role="status" region rather than announcing every value change.

Colour comes only from CSS custom properties: var(--bg), var(--raised), var(--text), var(--text-dim), var(--accent). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a range slider with two handles for filtering by price.

Two handles on a plain track with no information about the data behind it, so choosing a range was guesswork: nothing showed whether the band contained four results or four hundred. The handles could also pass each other, producing an inverted range that silently matched nothing.

### Attempt 2

> Draw a histogram behind the track and stop the handles crossing.

The histogram was decoration — it did not respond to the selection, so the bars inside and outside the range looked identical and the chart answered no question the slider had not already answered. Both thumbs also reported the full range as their own aria-valuemin and aria-valuemax, so a screen reader was told the minimum handle could go past the maximum.

## Why this one is worth keeping

The first version is what most sites ship, and the reason it is bad is not visual. A range filter without the distribution asks the user to guess where the data is, and then punishes the guess with an empty result page. Putting the histogram behind it is well known; making the bars respond to the selection and stating the count in words is what turns it from illustration into an answer.

The aria-valuemin and aria-valuemax detail is worth keeping because it is invisible and wrong by default. Each thumb's range genuinely is bounded by the other one, and reporting the full domain to both tells assistive technology something the control will not allow.

Stating the requirement as the cost of the current selection rather than as show a result count is what produced the live update during the drag, which is where its value actually is.
