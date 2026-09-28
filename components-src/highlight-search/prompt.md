# Highlight Search Field

- **Element ID:** `highlight-search`
- **Type:** input
- **Live:** https://prism.shinzuu-dev.workers.dev/components/highlight-search
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/highlight-search.json

Type and every match highlights — overlapping ranges, a distinct current match, and not one DOM node inserted. Survives re-renders, virtualized lists and text another system owns.

## Final prompt

```
Build a find-in-page search field in plain HTML, CSS and vanilla JavaScript, no dependencies, using the CSS Custom Highlight API.

The defining constraint: never insert or modify a single DOM node in the searched content. No <mark>, no innerHTML, no wrapping. Build Range objects over the existing text nodes and add them to a Highlight, which the browser paints without touching the tree. This is what makes it work on content that another system renders and re-renders.

Register exactly two highlights once, at startup: one for all matches and one for the current match. Do not create new Highlight objects per keystroke — clear and refill the existing ones. A range's appearance comes from which registered highlight it belongs to, so the current match must be a member of a different highlight, not the same one with a class.

Style them with ::highlight(name). Only a small set of properties apply there — colour, background-color, text-decoration — so do not attempt borders or padding.

Collect the text nodes once with a TreeWalker at startup and reuse that list. Walking the DOM on every keystroke is wasted work and the nodes do not change.

Enter moves to the next match, Shift+Enter to the previous, both wrapping. Show the position as current/total in a live region, and disable the navigation buttons when there are no matches.

Scrolling to the current match needs care: a Range has no scrollIntoView. Take its getBoundingClientRect and adjust the container's scrollTop only when the match is actually outside the visible area.

Feature-detect CSS.highlights and, when it is missing, disable the field and say so rather than silently doing nothing.

Colour comes only from CSS custom properties: var(--bg), var(--surface), var(--border), var(--text), var(--text-dim), var(--accent), var(--accent-fg), var(--mono), with color-mix for the match tint. No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a find-in-page search field that highlights matches in a passage below it.

Wrapped every match in a <mark> by rewriting innerHTML. That destroys and rebuilds the nodes, so any event listener, selection, caret position or focus inside the passage is lost on every keystroke; it breaks outright on content another framework owns; and searching across an element boundary is impossible because the text is not contiguous in the markup.

### Attempt 2

> Use the CSS Custom Highlight API instead so the DOM is untouched.

Created a new Highlight object on every keystroke and called CSS.highlights.set each time, which leaks registrations and leaves stale ranges painted. It also walked the DOM for text nodes on every search rather than once. The current match was styled with a second class on the same highlight, which cannot work — a range's appearance comes from which registered highlight it belongs to, not from an attribute.

## Why this one is worth keeping

The first attempt is what almost every in-page search on the web does, and the reason it is wrong is not performance — it is that rewriting innerHTML destroys everything else living in that subtree. Stating the constraint as never insert or modify a single DOM node, rather than asking for a highlight API, is what makes the choice inevitable.

The second attempt fails on a subtlety worth keeping: a highlight is a registered, named thing, and a range's style comes from its membership. Trying to distinguish the current match by giving it a class is a category error — ranges are not elements and have no attributes. Saying so directly prevented a whole afternoon of wondering why the selector did nothing.

The Range-has-no-scrollIntoView detail is the kind of small fact that costs an hour if nobody mentions it, and one line if they do.
