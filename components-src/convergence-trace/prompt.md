# Convergence Trace

- **Element ID:** `convergence-trace`
- **Type:** loader
- **Live:** https://prism.shinzuu-dev.workers.dev/components/convergence-trace
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/convergence-trace.json

A loader for work that converges rather than counts: the residual falls on a log axis, a least-squares fit over the tail extrapolates the finish, and a flattening slope says stalled instead of pretending to work.

## Final prompt

```
Build a loading indicator for an iterative solve — something that converges rather than counts — in plain HTML, CSS, SVG and vanilla JavaScript.

Plot the residual against iteration on a LOGARITHMIC y-axis spanning 1e0 down to about 1e-7. This is the core requirement: on a linear axis the residual collapses into the bottom pixel after two iterations and the trace is flat for the rest of the run. Map each value with Math.log10 and label the axis in decades.

Estimate the remaining iterations by least-squares fitting the last eight points IN LOG SPACE — fit log10(residual) against iteration index, not the raw residual. A converging solver is a straight line only after the log transform; fitting raw values chases a curve and the estimate swings and goes negative on noisy steps. Extrapolate that slope to the 1e-6 target and show the estimate as a dashed line on the chart.

If the fitted slope is shallower than about -0.02 decades per iteration, report 'stalled' rather than an estimate, and desaturate the trace to var(--text-dim). Being able to show stalled honestly is the reason to build this instead of a spinner. Simulate a run that converges fast, stalls for about ten iterations, then breaks through, so the stalled state is actually visible.

Drive it with setTimeout, not requestAnimationFrame — iterations are events, not frames. Stop the timer when the component scrolls out of view using IntersectionObserver, and under prefers-reduced-motion render the finished trace in one pass with no animation at all.

Use tokens only: var(--accent), var(--bg), var(--border), var(--text), var(--text-dim), var(--mono). No literal colours. Give the SVG role="img" and an aria-label, and put the live residual in text alongside the chart so the information is not shape-only.
```

## What failed first

### Attempt 1

> Build a loading indicator for a solver that shows the error going down over time.

Plotted the residual on a linear y-axis. The first two iterations use the entire height and everything after sits inside one pixel of the bottom edge — so the chart is blank precisely during the long tail, which is the part anyone is actually waiting through.

### Attempt 2

> Plot it on a log axis and estimate the remaining time from the trend.

Log axis fixed the shape, but the estimate was fitted to the raw residual values rather than their logarithms. On a log axis a converging solver is a straight line, so fitting the untransformed values chases a curve: the estimate swung wildly each iteration and went negative whenever a noisy step ticked upward.

## Why this one is worth keeping

The log axis and the log-space fit look like the same decision and are not. Plotting on a log axis is what makes the trace readable; fitting in log space is what makes the estimate stable — and getting the first right while missing the second is the natural mistake, because the chart then looks correct while the number next to it jitters and occasionally goes negative. The wider point is that a spinner cannot distinguish working from stuck, so it always claims to be working. A slope can tell the difference, and showing the flat stretch instead of hiding it is the honest design.
