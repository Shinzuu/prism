# Mention Field

- **Element ID:** `mention-field`
- **Type:** input
- **Live:** https://prism.shinzuu-dev.workers.dev/components/mention-field
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/mention-field.json

A comment field where @ tags a person by id. Mentions are ranges over plain text, so typing, pasting a copied @name, backspacing and arrowing all treat a mention as one token while the textarea keeps native undo, spellcheck and IME.

## Final prompt

```
Build a React + TypeScript + Tailwind @mention field. No dependencies.

Keep a real <textarea>. Store mentions as ranges { id, label, start, end } over the plain text, never as markup inside it, so native undo, spellcheck, IME input and paste keep working. Draw the highlights with an aria-hidden mirror div behind the textarea: same font, padding, line-height, white-space: pre-wrap, overflow-wrap and scrollbar-gutter, no border on either, the textarea's own text transparent with caret-color set. Marks get no padding or border, because either widens the name and pushes every later glyph out of line; use a box-shadow for the tint's breathing room. Under forced-colors, hide the mirror and show the textarea's text.

Carry the ranges across any edit by diffing old and new text: common prefix, common suffix, and the span between is the edit. A mention wholly outside the edit shifts; one the edit touched stops being a mention.

List every input path and handle each one:
- Typing @ after whitespace opens a listbox filtered by the query. The textarea is role=combobox with aria-expanded, aria-controls and aria-activedescendant. Arrow keys move, Enter or Tab picks, Escape closes and keeps it closed for that @ until the caret leaves. Options use mousedown, not click, so picking does not blur the field first.
- Pasting text resolves any @Label of a known person into a mention, longest label first, case-insensitive, word-bounded. Unknown @names stay text.
- Backspace right after a mention, or Delete right before one, removes it whole.
- The caret never rests inside a mention. Snap it by the direction it came from, not to the nearest edge, or ArrowLeft can never cross one.
- While an IME is composing, Enter confirms the composition and must not pick a suggestion.

Announce the match count in a polite live region. Put the focus ring on the rounded box with :has(:focus-visible), not on the textarea. Props: people, defaultValue, label, placeholder, help, maxSuggestions, rows, disabled, onChange({ text, mentions }), onMention(person), className. Colours from tokens only.
```

## What failed first

### Attempt 1

> Build an @mention textarea in React. A caret must never sit inside a mention: when it lands inside one, snap it to the nearest edge.

Arrowing right across a mention worked; arrowing left could never cross one. One step left from a mention's end puts the caret one character inside, the nearest edge from there is the end, and the snap put it straight back. A synthetic select event in the first test never exercised it, so the check passed until it was rewritten to press real keys. Rule: snap by the direction the caret came from, and test with real key presses.

### Attempt 2

> Highlight mentions with a mirror layer behind a transparent textarea, inside a rounded bordered box.

The alignment held, but focus was drawn twice: the box border turned accent and the textarea's own square focus ring sat outside the rounded corners. The textarea is the focus target but the box is the visible control, so the ring belongs on the box via :has(:focus-visible).

## Why this one is worth keeping

The widget is easy and every path through it is a separate bug. Typing an @ is the one a model builds. Pasting a name copied from an earlier comment, backspacing into a mention, arrowing across one and confirming an IME composition with Enter are four more, and none of them is in a prompt that describes the widget. Listing the paths is what gets them built.

The architecture decision does most of the work. Ranges over plain text, with the edit found by a prefix and suffix diff, means every way text can change — typing, cutting, dragging, undo — is handled by one function, instead of an event handler per path. A contenteditable would have given styled tokens for free and taken undo, IME and paste away with it.

The arrow-key bug is the useful lesson. The first test dispatched a select event and passed while the real keyboard path was broken in one direction. Snapping to the nearer edge is the obvious rule and it traps the caret; the rule that works depends on where the caret came from. A test that cannot fail is not a test, and a synthetic event is often one.
