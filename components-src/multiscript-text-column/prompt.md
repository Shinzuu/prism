# Multiscript Text Column

- **Element ID:** `multiscript-text-column`
- **Type:** section
- **Live:** https://prism.shinzuu-dev.workers.dev/components/multiscript-text-column
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/multiscript-text-column.json

Thai wraps without spaces, Japanese refuses to begin a line with 。or 」, and Arabic keeps its letters joined — shown beside the same Thai text with the usual English defaults applied.

## Final prompt

```
Build a set of narrow text columns demonstrating line breaking across scripts, in plain HTML, CSS and vanilla JavaScript.

Include Thai, Japanese, Arabic and English, each in its own column, with a slider that narrows the measure so the wrapping behaviour is visible.

Set the lang attribute on the ELEMENT CARRYING THE TEXT. This is not metadata: the engine chooses its line-breaking dictionary from it, and Thai is written without spaces, so with no lang there are no word boundaries to find and the correct CSS has nothing to work with.

Apply the per-script rules: line-break: strict for Japanese so kinsoku is honoured (no line may begin with 。or 」or a small kana), word-break: keep-all for Korean, and leave Thai on the defaults so the engine's dictionary does the work.

Never use word-break: break-all on non-Latin text. It is the usual answer to 'make it not overflow' and it damages every script here — cutting Thai mid-syllable, breaking Japanese where the rules forbid it, and disconnecting Arabic letters, which changes their shapes and makes the word genuinely harder to read. Use overflow-wrap: break-word if a last-resort break is needed, since it only acts when a word cannot fit at all.

Show ONE column twice — correct, and with break-all applied — so the damage is visible side by side instead of asserted in a comment. A reader who does not know these scripts cannot otherwise tell the two apart.

Give the Arabic column direction: rtl, and use logical properties throughout. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Make a narrow text column that never overflows, whatever the content.

Reached for word-break: break-all, which is the standard answer and is destructive outside Latin. It cuts Thai mid-syllable, breaks Japanese in places the kinsoku rules forbid, and severs Arabic letters from the neighbours they are joined to — producing text that is not merely ugly but, in Arabic, genuinely harder to read because the letterforms change when disconnected.

### Attempt 2

> Apply the right line-breaking rules for each language's text.

Set the CSS properties but not the lang attribute. The engine selects its line-breaking dictionary from lang, and Thai has no spaces at all — without it there are no word boundaries to find, so the text either overflows or breaks at arbitrary characters. The CSS was correct and did nothing, because the information it needed was missing from the markup.

## Why this one is worth keeping

The instructive failure is the second one: writing correct CSS that cannot work because the markup withholds what it needs. lang looks like metadata for search engines and screen readers, and it is also the input to the text engine's word-segmentation dictionary — for Thai, which has no inter-word spaces, it is the only source of word boundaries in the entire system. The first failure is more common and more damaging: word-break: break-all is the reflexive fix for overflow and it is a Latin-only assumption, treating characters as interchangeable units when in Arabic they are joined and change shape depending on their neighbours.
