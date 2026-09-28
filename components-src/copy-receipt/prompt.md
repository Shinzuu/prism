# Copy With Receipt

- **Element ID:** `copy-receipt`
- **Type:** button
- **Live:** https://prism.shinzuu-dev.workers.dev/components/copy-receipt
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/copy-receipt.json

Copies, then shows exactly what landed on the clipboard, how much of it, where it came from, and offers to put back whatever was there before.

## Final prompt

```
Build a copy button that issues a receipt, in plain HTML, CSS and vanilla JavaScript, no dependencies.

On copy, show a receipt panel containing: the exact text that was written, a character count and a line count when it is multi-line, and the label of the element it came from. The user must be able to verify the copy without pasting it somewhere to find out.

Before writing, read the existing clipboard contents with navigator.clipboard.readText and keep them. Offer a button to restore them, and hide that button when there was nothing to restore or the contents are unchanged. A copy button that destroys staged clipboard content without recourse is doing damage on the user's behalf.

Handle failure honestly. Both the read and the write can reject — permissions, insecure context, a browser that will not allow it. Wrap each separately, never claim success when the write rejected, and say plainly that nothing was written.

Announce through a role="status" element with the character count and origin, not the copied text itself, which could be long.

Show the copied text in a scrollable block capped at about five lines so a large copy does not push the page around.

Dismiss the receipt after about nine seconds — long enough to read, short enough not to become furniture.

Colour comes only from CSS custom properties: var(--bg), var(--surface), var(--raised), var(--border), var(--text), var(--text-dim), var(--accent), var(--accent-fg), var(--mono). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a copy button that confirms the copy worked.

Swapped its label to "Copied!" for two seconds. That confirms a function returned, not that the right thing is on the clipboard — the one fact the user cannot verify without pasting somewhere. It also swallowed failures: a rejected clipboard write left the button cheerfully claiming success, which is the worst possible outcome for a control whose only job is to be trusted.

### Attempt 2

> Show what was copied and handle failure.

Showed the copied text but silently destroyed whatever was on the clipboard before, with no way back. For a one-line command that is a small loss; for someone who had a paragraph staged to paste, it is real damage caused by a button they pressed to be helpful.

## Why this one is worth keeping

This is a component almost nobody thinks needs building, which is why the failure is interesting. "Copied!" confirms that a function returned. It does not confirm what is on the clipboard, and a user who has been burned by a copy button that grabbed the wrong line has no way to check without leaving the page.

The instruction that produced the real component was framing the requirement around verification: the user must be able to verify the copy without pasting it somewhere. That single sentence implies the text, the count and the origin, none of which had to be requested separately.

The undo is the part that makes it more than a nicety. Reading the clipboard before writing is two lines, and it converts a destructive action into a reversible one. Once stated as a principle — do not destroy staged content without recourse — it is obvious, and it applies well beyond clipboards.
