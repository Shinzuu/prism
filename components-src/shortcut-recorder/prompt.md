# Shortcut Recorder

- **Element ID:** `shortcut-recorder`
- **Type:** form
- **Live:** https://prism.shinzuu-dev.workers.dev/components/shortcut-recorder
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/shortcut-recorder.json

Press the combination you want and it captures it, refuses ones the browser has already claimed by naming what they would break, and treats a modifier on its own as incomplete rather than as a binding.

## Final prompt

```
Build a keyboard shortcut recorder in plain HTML, CSS and vanilla JavaScript, no dependencies.

A button that, when activated, listens for the next key combination and displays it.

Listen on the capture phase with a document-level keydown listener and call both preventDefault and stopPropagation. On the bubble phase the browser has already acted — Ctrl+W closes the tab before your handler sees it — so capture is not an optimisation here, it is the difference between working and destroying the user's session.

A modifier pressed alone is an incomplete binding, not a binding. Show the modifiers held so far followed by an ellipsis and keep listening, rather than recording Shift as a shortcut.

Maintain a list of combinations the browser or platform has already claimed, and when the user presses one, name what it would break — "Ctrl+W is already Close tab in the browser" — rather than refusing with a generic message. A rejection that does not say why sends the user round the same loop.

Escape cancels and restores the previous binding. Backspace clears to none. Both must be handled before the recorder treats them as candidate keys, or there is no way out of listening mode.

Render modifiers in a consistent order — Ctrl, Meta, Alt, Shift — so the same combination always displays identically, and map arrow keys, Escape and space to readable symbols rather than their raw key values.

Stop listening on blur so a recorder left open does not swallow keystrokes meant for the rest of the page.

Emit a bubbling CustomEvent named sr:bind carrying the normalised combination.

Colour comes only from CSS custom properties: var(--bg), var(--border), var(--text), var(--text-dim), var(--accent), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build an input that records a keyboard shortcut when the user presses it.

Listened on the bubble phase, so pressing Ctrl+W closed the tab before the handler ran and Ctrl+P opened the print dialogue. It also accepted a lone Shift as a complete binding, because a modifier keydown looks like any other keydown if you do not check for it, so simply reaching for a modifier recorded a useless shortcut.

### Attempt 2

> Capture the keys before the browser acts and ignore lone modifiers.

Capture and preventDefault fixed the interception, but conflicting bindings were rejected with a generic "that shortcut is not available", which tells the user nothing about why or what to avoid. There was also no way to cancel: once listening, every key including Escape was swallowed into the recording.

## Why this one is worth keeping

The capture-phase requirement is the one that has to be stated, because the consequence of getting it wrong is not a bug report — it is the tester's tab closing while they try the component. Explaining why in the prompt, rather than just specifying capture, is what makes it survive a later refactor.

The lone-modifier case is a small instance of a general problem: an event that arrives at the same handler is not necessarily the same kind of event. Keydown fires for modifiers too, and treating every keydown as a complete binding produces nonsense the moment a user reaches for Ctrl before deciding which key to press.

The conflict message is the interesting design point. "Not available" is technically accurate and practically useless. Naming the binding that would break turns a refusal into information, and it costs one lookup table. That principle — say what it would break, not that it is unavailable — applies to most validation.
