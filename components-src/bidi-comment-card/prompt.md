# Bidi Comment Card

- **Element ID:** `bidi-comment-card`
- **Type:** card
- **Live:** https://prism.shinzuu-dev.workers.dev/components/bidi-comment-card
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/bidi-comment-card.json

Arabic and Hebrew comments mixed with Latin handles, URLs and counts, each isolated so one string's direction cannot reorder the sentence beside it — with a toggle to see it break.

## Final prompt

```
Build a comment list mixing Arabic, Hebrew and Latin text, in plain HTML, CSS and vanilla JavaScript.

Wrap every independently-authored string — the handle, the URL, the like count — in a <bdi> element. This is the element's entire purpose: it isolates the run so its direction cannot leak into the text around it. dir on a shared parent cannot do this, because the runs still resolve against one another inside that context.

Set dir and lang on the ELEMENT CARRYING THE TEXT, not on an ancestor. The paragraph's direction is what decides which end the trailing full stop goes to, so putting dir on a wrapper leaves the punctuation misplaced while the words themselves look fine.

Include a toggle that sets unicode-bidi: normal on the isolated runs, so a reader can see the failure directly instead of being told about it. The demonstration is the point: describe the bug and nobody believes it matters, show the full stop jumping to the far end of the line and it is obvious.

Choose content that actually breaks: an Arabic sentence ending in punctuation, a Latin handle beside Hebrew text, and a sentence containing Western digits inside Arabic (version numbers are ideal), since digits take a direction of their own.

Use logical CSS properties throughout so the card mirrors correctly, and never use float or margin-left for layout here.

Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a comment card that supports Arabic and Hebrew text.

Set dir="rtl" on the card container. That flips the layout, but the strings inside still share one bidi context, so a Latin username next to Arabic text pulled the sentence's trailing full stop to the far end of the line, and the like count landed before the username instead of after it. The text was readable; the punctuation was in the wrong place, which reads as sloppiness rather than as a bug.

### Attempt 2

> Set dir on each text element individually based on its language.

Fixed the paragraphs and not the inline runs. A handle, a URL and a number sitting side by side in one metadata line are three independently-authored strings with three directions, and dir on their shared parent cannot isolate them from each other. Neighbouring runs still reordered — the classic symptom being a URL that appears to start with its own trailing slash.

## Why this one is worth keeping

Bidi bugs are unusual in that the text remains perfectly readable while being visibly wrong — a misplaced full stop or a like count that swapped sides looks like careless design rather than a rendering failure, so it survives review by anyone who does not read the language. The specific lesson is that dir is not enough. Direction on a container establishes a context; it does not isolate the runs inside it from each other, so a Latin username and an Arabic sentence in the same line still negotiate their order. <bdi> exists precisely for user-generated strings of unknown direction, and a comment card is the canonical case: every value on it was typed by a different person in a different script.
