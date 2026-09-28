# Cron Builder

- **Element ID:** `cron-builder`
- **Type:** form
- **Live:** https://prism.shinzuu-dev.workers.dev/components/cron-builder
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/cron-builder.json

Five fields, the expression, a plain-English reading, and the next five times it will actually fire in your timezone — including saying never when nothing matches.

## Final prompt

```
Build a cron expression builder in plain HTML, CSS and vanilla JavaScript, no dependencies.

Five text fields — minute, hour, day of month, month, day of week — the assembled expression, a plain-English reading, and the next five times it will fire.

The next-run list is the component. A description of the syntax tells the user what they already typed; the actual firing times answer the question they have. Compute them by expanding each field into a set of permitted values and walking forward from now, minute by minute, testing all five.

That walk needs a hard ceiling. Some expressions never fire — the 31st of February is the classic — and an unbounded search hangs the tab. Cap the scan at roughly four years of minutes and, when nothing matches, say never rather than showing an empty list.

Parse each field as a comma-separated list of terms, where a term is a star, a number, a range, or either of those with a step. Reject out-of-range values and inverted ranges by marking that field aria-invalid, and when any field is invalid say plainly that there is nothing to predict instead of showing stale times.

Format the times with Intl.DateTimeFormat and no locale argument, and display the resolved timezone name beside the heading, so it is never ambiguous which clock these are in.

The English reading should degrade gracefully: name weekdays and months in words, collapse long minute lists into a count rather than reciting twenty numbers, and drop the month clause entirely when it is every month.

Announce the reading through a role="status" region.

Colour comes only from CSS custom properties: var(--bg), var(--raised), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a cron expression builder with a human-readable description.

Produced a description by pattern-matching a few common shapes and falling back to restating the syntax, so anything unusual came back as "Runs at */15 * * * *", which is the string the user already typed. It never computed a single actual time, which is the only question anyone has about a cron expression.

### Attempt 2

> Compute the next run times from the expression.

Walked forward minute by minute with no upper bound, so an impossible expression — 31st of February — hung the tab in an infinite loop. It also matched day-of-month and day-of-week without noticing they interact, and quietly assumed UTC while displaying times as though they were local.

## Why this one is worth keeping

The first attempt is the standard cron helper and it is useless for the same reason a spinner is useless: it restates the input. The instruction that fixed it was not about correctness but about which question the component answers — a description tells the user what they typed, the firing times answer what they asked.

The infinite loop is the more valuable lesson. Any search over a domain that may have no solution needs a stated bound and a defined answer for the empty case, and a model will happily write the unbounded version because the bounded one needs a decision it was not given. Naming the impossible case — the 31st of February — made the requirement concrete enough to implement.

The timezone point is small and consequential: computing in one clock and displaying in another produces times that are wrong by hours, silently. Showing the resolved timezone next to the list costs one line and makes the ambiguity impossible.
