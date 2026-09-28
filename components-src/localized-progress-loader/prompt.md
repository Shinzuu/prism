# Localized Progress Loader

- **Element ID:** `localized-progress-loader`
- **Type:** loader
- **Live:** https://prism.shinzuu-dev.workers.dev/components/localized-progress-loader
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/localized-progress-loader.json

The sentence rewrites itself as the count changes, through the language's live plural category — Polish has four, Arabic six, Japanese one — and the bar fills from the correct edge in Arabic.

## Final prompt

```
Build a progress indicator whose sentence is grammatically correct in several languages, in plain HTML, CSS and vanilla JavaScript.

Key the messages by CLDR PLURAL CATEGORY — zero, one, two, few, many, other — not by number, and select the category with Intl.PluralRules for the active locale. Do not write n === 1 ? singular : plural: that is English grammar expressed as arithmetic, and it cannot represent Polish (which needs a separate form for 2-4 and for 5+), Russian, or Arabic (which has a dual). Include English, Polish, Russian, Arabic and Japanese, and give Japanese only 'other', because it has exactly one form. Always fall back to 'other', which every language defines.

Format the number itself with Intl.NumberFormat for the locale rather than interpolating the raw digits.

Set lang and dir on the element showing the sentence, and use LOGICAL CSS properties for the fill — margin-inline-start, not margin-left. In Arabic the bar must fill from the right; a physical property pins it to the wrong edge and the bar visibly runs backwards.

Show the plural category the engine selected next to the percentage, so the mechanism is visible rather than asserted.

Stop the timer when the component scrolls out of view with IntersectionObserver, and respect prefers-reduced-motion on the fill transition.

Use tokens only: var(--accent), var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a progress bar that says how many files are uploading.

Concatenated 'Uploading ' + n + ' files', which produces 'Uploading 1 files'. The usual patch is n === 1 ? 'file' : 'files', which is correct for English and encodes English grammar as if it were arithmetic — it cannot express Polish, which needs a different form for 2-4 than for 5+, or Arabic, which has a distinct dual.

### Attempt 2

> Translate the strings for each supported language.

Translated the two English forms, so every language inherited English's two-way singular/plural split. Polish and Russian silently lost their 'few' form and Arabic lost four of its six, which reads as broken grammar to a native speaker rather than as a missing translation. The bar also still filled left to right in Arabic, because the fill used padding-left.

## Why this one is worth keeping

The instructive part is that the standard fix is also wrong. Everyone knows not to write 'Uploading 1 files', and the reflex repair — a ternary on n === 1 — hardcodes the assumption that languages have exactly two number forms. Translating the strings afterwards then propagates that assumption into every language, so Polish and Russian quietly lose a form they need and Arabic loses four. Keying on the plural category instead means the language decides how many forms exist. The direction bug rides along with it: a progress bar built with padding-left fills away from the text's reading direction in Arabic, which looks like the upload is undoing itself.
