# IME Search Field

- **Element ID:** `ime-search-field`
- **Type:** input
- **Live:** https://prism.shinzuu-dev.workers.dev/components/ime-search-field
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/ime-search-field.json

A search field that waits for the composed word. Typing 你好 on a pinyin IME fires one query, not five for the letters n-i-h-a-o — shown against the naive field side by side.

## Final prompt

```
Build a search input that behaves correctly under an IME (pinyin, kana, hangul), in plain HTML, CSS and vanilla JavaScript.

The problem: composing 你好 on a pinyin IME emits the intermediate letters n, ni, nih, niha, nihao as real input events. A field that queries on input searches the pinyin five times and matches nothing. The bug does not exist in Latin script, so it ships.

Use BOTH guards, because either alone is insufficient:
1. A flag set on compositionstart and cleared on compositionend.
2. event.isComposing on the input event itself.
The flag alone is wrong in Safari and Firefox, where the last input event fires BEFORE compositionend and so sees the flag already cleared. isComposing alone misses state you need between events. Comment on why both are present, or someone will delete one.

Fire the real query from compositionend, since that is the first moment the composed word is final. Debounce the non-composing path separately — debounce does not solve this, because composition pauses are longer than any sane debounce window.

Show a second log, side by side, of what an unguarded field would have requested, so the waste is visible rather than asserted. Include a replay button that steps through a pinyin composition and ends on 你好, because most reviewers have no IME installed and will otherwise see nothing. Note in a comment that isComposing is read-only and cannot be faked, so the replay drives the two code paths directly.

Show the live composition state in the field. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours. Label the input properly and make the query log an aria-live region.
```

## What failed first

### Attempt 1

> Build a search input that queries as you type, debounced.

Debounce is measured in milliseconds and composition is measured in keystrokes, so they do not overlap. A user composing 你好 pauses between syllables and the debounce fires anyway — querying for the pinyin letters, which match nothing. Every query during a composition is wasted, and in Latin script the bug is completely invisible.

### Attempt 2

> Suppress the query while an IME composition is in progress.

Tracked composition with a boolean set on compositionstart and cleared on compositionend. Correct in Chrome, wrong elsewhere: in Safari and Firefox the final input event fires BEFORE compositionend, so the flag is already false and one stray query for the raw pinyin still escapes — the exact bug, just rarer and harder to reproduce.

## Why this one is worth keeping

This is a bug you cannot find without switching input methods, which is why it survives in shipped products — the field works perfectly in English and fires five useless requests per word in Chinese. The subtle half is the event ordering: guarding on compositionstart and compositionend alone is correct in Chrome and wrong in Safari and Firefox, where the final input event arrives before compositionend and slips one pinyin query through. Reproducing that requires the right browser AND the right input method at once, so the naive fix looks complete for a long time.
