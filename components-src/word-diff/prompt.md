# Word Diff

- **Element ID:** `word-diff`
- **Type:** section
- **Live:** https://prism.shinzuu-dev.workers.dev/components/word-diff
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/word-diff.json

Changes marked at word level rather than line level, from a real longest-common-subsequence pass, with inline and split views over the same computed operations.

## Final prompt

```
Build a word-level text diff in plain HTML, CSS and vanilla JavaScript, no dependencies and no diff library.

Tokenise on words, keeping each word's trailing whitespace attached so the rendered output preserves spacing without reconstruction.

Compute a real longest common subsequence over the tokens with a dynamic programme, then walk it to emit a flat list of same, insert and delete operations. Do not compare arrays by index: inserting one word near the start shifts every later index and reports the rest of the text as changed. Index comparison only works when nothing moves, which is the one case a diff never faces.

Render insertions as ins elements and deletions as del elements — the semantic elements exist for exactly this and carry meaning that a span with a class does not.

Give every ins and del an aria-label saying added or removed followed by the text, because the distinction is carried by colour and strikethrough, neither of which reaches a screen reader.

Support two views over the same computed operations: inline, showing insertions and deletions together in one pane, and split, showing the old text with deletions only on the left and the new text with insertions only on the right. Both views render the same operation list and differ purely in CSS, so the two can never disagree about what changed.

Use box-decoration-break: clone so a highlight spanning a line break is drawn correctly on both lines.

Report the count of added and removed words in the toolbar, tabular-nums.

Colour comes only from CSS custom properties: var(--surface), var(--border), var(--text), var(--text-dim), var(--accent), var(--accent-fg), with color-mix for the two highlight tints. No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a diff view showing changes between two paragraphs.

Split on newlines and compared line by line, so a single changed word marked an entire sentence as removed and re-added. The reader then has to diff the diff by eye to find the actual edit, which is the exact work the component was supposed to do.

### Attempt 2

> Diff at word level instead.

Compared word arrays by index, so inserting one word near the start shifted everything after it and reported the rest of the paragraph as changed. Index comparison is not a diff; it only works when nothing moves, which is the case a diff never faces.

## Why this one is worth keeping

The instruction that mattered was the one ruling out the shortcut. Index comparison looks like a diff, passes a casual test where someone changes a word in place, and collapses the moment anything is inserted. Naming why — inserting one word shifts every later index — made the shortcut unusable rather than merely discouraged.

Deriving both views from one operation list is the structural decision worth keeping. Two independently rendered views of the same comparison will eventually disagree; making split a CSS variation of inline means there is only ever one answer about what changed.

And the semantic elements are free correctness. ins and del carry the meaning in the markup, so the styling can change without the document losing what it means.
