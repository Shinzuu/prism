# Collation Sort Table

- **Element ID:** `collation-sort-table`
- **Type:** table
- **Live:** https://prism.shinzuu-dev.workers.dev/components/collation-sort-table
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/collation-sort-table.json

The same twelve names take four different orders depending on locale. Ö files with O in English and after Z in Swedish, Turkish puts C before Ç, and plain .sort() gets it wrong in every language including English.

## Final prompt

```
Build a name list that demonstrates locale-aware sorting, in plain HTML, CSS and vanilla JavaScript.

Use a single Intl.Collator constructed ONCE per sort and pass collator.compare to Array.prototype.sort. Do not call localeCompare inside the comparator: that constructs a collator per comparison, which is O(n log n) collators for one sort, and it silently uses the runtime's default locale, so the same data sorts differently on different machines.

Offer at least four orderings and choose names that actually separate them:
- English (German agrees for this data) files Ö with O and Ç with C.
- Swedish treats Å, Ä and Ö as distinct letters that come AFTER Z.
- Turkish sorts C before Ç, and dotless ı before dotted i.
- A 'code point order' option using bare .sort(), to show the baseline everyone ships by accident — every non-ASCII letter after Z.

Verify that every option you offer produces a DIFFERENT order before shipping, and choose the names to guarantee it: Cem and Çelik separate Turkish from English, Işık and İnönü separate dotless from dotted i, Åkerman and Öberg separate Swedish. Offering two locales that happen to agree on your data is a control that appears to work and demonstrates nothing — do not include a locale you cannot show a difference for.

Highlight the rows whose position changed from the previous ordering, so switching locale shows movement rather than requiring the reader to diff two lists by eye. Explain in one sentence what the selected locale's rule is.

Set lang on the explanatory text to match. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a sortable list of names in alphabetical order.

Used Array.prototype.sort() with no comparator, which sorts by UTF-16 code point. Every accented letter lands after Z, so Öberg and Åkerman appear below Zettel. That is not one language's ordering — it is no language's ordering, and it is wrong for English too.

### Attempt 2

> Use localeCompare so the accents sort correctly.

Right function, wrong place: called a.localeCompare(b) inside the comparator, which constructs a fresh collator on every comparison — O(n log n) of them for one sort, and measurably slow past a few hundred rows. It also pinned the result to the runtime's default locale, so the same list sorted differently depending on whose machine rendered it, which is the kind of bug that never reproduces.

## Why this one is worth keeping

Bare .sort() on strings looks like it works, because it is correct for ASCII and most test data is ASCII. It is not alphabetical order; it is code-point order, and it is wrong in every human language — accented letters land after Z, which no locale does. The second failure is more interesting because the fix is nearly right: localeCompare produces the correct ordering while constructing a collator per comparison and defaulting to whatever locale the machine happens to have. That means correct output in development, a performance cliff at scale, and an ordering that changes depending on who loaded the page — a bug that cannot be reproduced on the developer's own machine.
