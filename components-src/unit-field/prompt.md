# Unit Field

- **Element ID:** `unit-field`
- **Type:** input
- **Live:** https://prism.shinzuu-dev.workers.dev/components/unit-field
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/unit-field.json

Accepts 12px, 1.5rem, 50% or 2cqi, keeps the unit while arrow keys step the number, and steps in the unit's own granularity rather than always by one.

## Final prompt

```
Build a CSS length input in plain HTML, CSS and vanilla JavaScript, no dependencies.

Accept a number with an optional unit from px, rem, em, %, ch, vw, vh and cqi. Default to px when no unit is given.

Arrow Up and Down step the number and leave the unit untouched. Shift multiplies the step by ten, Alt divides it by ten.

The step size depends on the unit, which is the point of the component. Absolute and viewport units — px, %, vw, vh — step by 1. Relative units — rem, em, ch, cqi — step by 0.1, because a step of 1rem is a doubling at typical values while a step of 1px is invisible at 400px.

Never rewrite the field while the user is typing. Validate on input, but only normalise the text on blur. A field that reformats mid-keystroke makes it impossible to type a decimal.

Mark invalid input with aria-invalid rather than blocking the keystroke, so a partially typed value like "1." is simply not yet valid rather than rejected.

Show conversions only where they are actually defined without layout context: px and rem convert to each other through the root size, while %, ch, vw, vh and cqi depend on a container or viewport and must say so rather than showing an invented number.

Display the current unit as a suffix inside the field, pointer-events none, so it is visible without being editable separately.

Use a monospace face and tabular-nums, since this is measurement.

Colour comes only from CSS custom properties: var(--bg), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build an input that accepts a CSS length with a unit.

A text input with a regex on submit. Arrow keys did nothing, since a text input has no stepping, so the component gave up the single most useful behaviour of a number field. Typing "1." on the way to "1.5" was marked invalid, because validation ran on every keystroke against a complete-value pattern.

### Attempt 2

> Add arrow key stepping and keep the unit.

Stepped by 1 regardless of unit, so one press took 1rem to 2rem — a doubling — while taking 400px to 401px, an invisible change. It also normalised the text on every keystroke, so typing a decimal point rewrote the field out from under the caret.

## Why this one is worth keeping

Two general rules came out of this one.

First: a step is a unit-dependent quantity, not the number one. The model's default is to add 1 because that is what a number input does, and it produces a control that is useless in half its modes. Stating the granularity per unit family, with the reason — 1rem is a doubling, 1px is invisible — got it right immediately.

Second, and more broadly applicable: separate validating from normalising, and run them at different times. Validate on input so feedback is live, normalise on blur so the field never rewrites itself under the caret. Nearly every text field that feels hostile to type in has merged those two steps.

The conversion table is a smaller honesty point of the same kind as the queue estimate: show the conversions that exist, and say plainly that the others depend on context, rather than printing a number computed from an assumed container.
