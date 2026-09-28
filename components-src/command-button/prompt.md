# Declarative Command Button

- **Element ID:** `command-button`
- **Type:** button
- **Live:** https://prism.shinzuu-dev.workers.dev/components/command-button
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/command-button.json

Buttons that open a dialog, toggle a popover and fire a custom action without a single event listener attached to them. The button names its target and its verb; the browser does the wiring, including focus return, Esc and inertness.

## Final prompt

```
Build a set of buttons that demonstrate the invoker commands API in plain HTML, CSS and a minimal amount of JavaScript.

Three buttons, none of which carries an event handler of its own:

1. Opens a modal <dialog>. Use commandfor pointing at the dialog's id, and command="show-modal" — the hyphenated token, not showModal. The dialog contains its own close button using command="close" against the same id.
2. Toggles a popover element, using command="toggle-popover" against an element carrying the bare popover attribute.
3. Fires a custom command. Custom command names MUST begin with two dashes, e.g. command="--clear". Anything not starting with two dashes and not on the built-in list is silently ignored: no error is thrown and no event is dispatched, so a wrong name looks exactly like broken CSS.

The one piece of JavaScript is a listener for the custom command. Attach it to the TARGET element, not to the button, because CommandEvent is dispatched at the element named by commandfor. Read event.command to branch. Explain in a comment that this is why a single listener serves every button aimed at that target, including ones added to the page later.

Style with :popover-open and ::backdrop rather than toggling classes, so no state is mirrored in JavaScript. Use tokens: var(--accent), var(--accent-fg), var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--mono). Do not write a literal colour anywhere.

Keyboard behaviour — Esc to close, focus returning to the invoking button, the rest of the page going inert — must come from the platform. Do not implement any of it. Respect prefers-reduced-motion.
```

## What failed first

### Attempt 1

> Build a button that opens a modal dialog and returns focus properly when it closes.

Produced the usual onclick handler calling showModal(), plus hand-written code to remember the previously focused element and restore it on close, and a keydown listener for Escape. All three already exist in the platform. The hand-rolled focus return also broke when the dialog was opened from inside another dialog, because it stored a single element rather than a stack.

### Attempt 2

> Build a button that opens a dialog using the invoker commands API instead of JavaScript.

Used command="open" and command="showModal". Neither is a real value, and here is the trap: an unrecognised command is not an error. No exception, no console warning, nothing in the DOM to inspect — the button is simply inert. The correct tokens are the hyphenated show-modal and close, and the only way to find that out is to already know it.

## Why this one is worth keeping

The failure mode here is unusually cruel, and it is why this component is worth shipping. Get the command token wrong — showModal instead of show-modal, or a custom name missing its two leading dashes — and nothing happens. No exception, no warning, no attribute rejected in the inspector. The button just sits there, which reads as a CSS problem or a stacking issue, and sends you debugging the dialog instead of the six characters that are actually wrong. The second insight is where the event lands: CommandEvent fires on the target, not the button. That inversion is what makes the API worth using at all, because one listener on the target serves every invoker pointing at it, including markup added long after the listener was attached.
