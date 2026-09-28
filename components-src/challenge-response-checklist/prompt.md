# Challenge Response Checklist

- **Element ID:** `challenge-response-checklist`
- **Type:** modal
- **Live:** https://prism.shinzuu-dev.workers.dev/components/challenge-response-checklist
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/challenge-response-checklist.json

Each line states a condition and the expected reply, confirmed one at a time — with one item that deliberately holds until its precondition is true, so the sequence cannot be completed on autopilot.

## Final prompt

```
Build a challenge-and-response checklist, in the aviation sense, in plain HTML, CSS and vanilla JavaScript.

Each item is a CHALLENGE and its expected RESPONSE — 'Parking brake' / 'SET' — not a bare label. The response is what makes verification possible: it states what correct looks like, so the item can be checked rather than merely acknowledged.

Confirm items INDIVIDUALLY and in order. Provide no select-all, no 'confirm remaining', no bulk action of any kind. A control that completes the list in one press is the exact mechanism by which checklists stop working, and it must not exist even as a convenience.

Include at least one item that HOLDS: its precondition is false, so it cannot be confirmed, and the list refuses to advance past it until the precondition becomes true on its own. This is the feature that distinguishes a checklist from a progress bar — it can say no. Make the hold state visually distinct and explain in the item why it is holding.

Show upcoming items, dimmed and inert, rather than hiding them. Hiding what is ahead prevents anyone from questioning the sequence, and the point of reading a checklist aloud is that it can be challenged.

The final commit action stays disabled until every item is individually confirmed.

Put the progress and the holding state in an aria-live region, make every control a real button, and never rely on colour alone to convey the hold — carry it in the text too.

Use tokens only: var(--accent), var(--accent-fg), var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a pre-flight checklist where the user ticks off each item.

A list of checkboxes with a Select all control. Select all is the precise negation of a checklist: the value is in the individual verification, and one control that marks everything done converts the ritual into a formality. The items were also plain labels rather than challenge-and-response pairs, so nothing stated what a correct answer looked like.

### Attempt 2

> Require items to be confirmed in order, one at a time.

Sequential and still frictionless — every item was confirmable the moment it became current, so the whole list could be cleared by clicking the same spot six times without reading a word. A checklist that can be completed by rhythm is not verifying anything, and hiding the upcoming items made it worse, since the crew could not see what was ahead.

## Why this one is worth keeping

A checklist is a social and procedural instrument, and most software versions of one quietly remove the parts that make it work. Select-all is the obvious offender, but sequential confirmation alone is not enough either — if every item is confirmable the instant it becomes current, the list can be cleared by rhythm without any of it being read. The holding item is what makes the artefact honest: it means the checklist has an opinion about the world and can refuse, rather than simply recording that someone clicked six times. Keeping the upcoming items visible follows from the same principle, since a sequence nobody can see is a sequence nobody can challenge.
