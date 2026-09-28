# Grapheme Budget Field

- **Element ID:** `grapheme-budget-field`
- **Type:** input
- **Live:** https://prism.shinzuu-dev.workers.dev/components/grapheme-budget-field
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/grapheme-budget-field.json

Counts what a person would call a character. A family emoji costs one, not eleven, and truncating never splits a character in half — with all three competing counts shown side by side.

## Final prompt

```
Build a text field with a character budget that counts the way a reader does, in plain HTML, CSS and vanilla JavaScript.

Use Intl.Segmenter with granularity 'grapheme' to count. This is the only method that agrees with a person: 👨‍👩‍👧‍👦 is one character, a regional-indicator flag is one, and a base letter plus a combining accent is one. string.length counts UTF-16 code units (eleven for that emoji) and [...string] counts code points (seven) — both are implementation details leaking into the interface.

Show ALL THREE counts in a small table, labelled, so the disagreement is the visible point of the component rather than a claim in a comment.

Truncation must join whole graphemes — take the segmented array, slice it, join it. Never slice the raw string: cutting inside a zero-width-joiner sequence splits a family emoji into separate people, and cutting between a surrogate pair produces a lone surrogate, which renders as a replacement glyph and is not valid in JSON, so it fails at the API boundary rather than in the UI.

Feature-detect Intl.Segmenter and fall back to code points, saying so in the readout rather than silently reporting a different number.

Seed the field with text that actually demonstrates the problem: a flag, a ZWJ family emoji, and an accented word. A field containing only ASCII shows nothing.

Put the count in an aria-live region and tie it to the textarea with aria-describedby. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a text field with a character counter and a limit.

Used string.length, which counts UTF-16 code units. The family emoji 👨‍👩‍👧‍👦 counts as eleven, a flag as four, and café typed with a combining accent as five. The field tells someone their visibly short message is over the limit, and no explanation makes that feel like anything but a bug.

### Attempt 2

> Count code points with the spread operator instead.

Closer and still wrong. [...string] counts the family emoji as seven — it splits on the zero-width joiners — and counts a combining accent separately from the letter it sits on. Truncating on code points then cut between the man and the woman in the emoji, leaving two unrelated people, and cutting mid-surrogate produced a lone surrogate that renders as a replacement glyph and is invalid in JSON.

## Why this one is worth keeping

Every wrong answer here is confidently wrong and produces a number, which is what makes this worth shipping. string.length is what almost every character counter uses, and it is not counting characters — it is counting UTF-16 storage units, an encoding detail that has no business being shown to a user. The truncation half is worse than the counter half: slicing a string at an arbitrary index can cut a surrogate pair in two, and the resulting lone surrogate is not merely ugly, it is unencodable in JSON, so the bug surfaces as a serialisation failure somewhere far from the field that caused it.
