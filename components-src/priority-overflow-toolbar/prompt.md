# Priority Overflow Toolbar

- **Element ID:** `priority-overflow-toolbar`
- **Type:** navbar
- **Live:** https://prism.shinzuu-dev.workers.dev/components/priority-overflow-toolbar
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/priority-overflow-toolbar.json

Measures its own box rather than the viewport, so actions migrate into a menu when the container is narrow — including at 400% zoom, where the viewport lies and a media query does nothing.

## Final prompt

```
Build a toolbar that moves actions into an overflow menu based on its OWN width, in plain HTML, CSS and vanilla JavaScript.

Use a ResizeObserver on the toolbar element. Do not use media queries or window resize listeners: the toolbar's width is not the viewport's. A toolbar in a sidebar is narrow on a wide monitor, and at 400% browser zoom the viewport reports a comfortable width while the text is four times its size — a media query never fires and the buttons simply overflow. This is a real accessibility requirement, not a nicety: WCAG reflow expects content to work at 400% zoom.

Measure every button's width ONCE with all of them visible, and cache it. Measuring inside the fitting loop reads a layout the loop is actively changing, which makes the result order-dependent and can oscillate — the observer fires on the resize it just caused and hides one more item forever.

Give each action a priority. Overflow the LOWEST priority first so the most important action survives longest, and remember that once anything overflows, the More button itself takes space that must come out of the budget.

The overflow control must be a real button with aria-expanded and aria-haspopup, its menu items real buttons with role="menuitem", Escape closing and returning focus, and a click outside dismissing it. Show the count of hidden actions on the button.

Include a width slider so a reviewer can see the behaviour without resizing their browser, and print the measured container width so the mechanism is visible.

Use logical properties (margin-inline-start, inset-inline-end) so the bar mirrors in RTL. Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours.
```

## What failed first

### Attempt 1

> Build a toolbar that collapses into a More menu on small screens.

Used media queries on viewport width. The toolbar is not the viewport: placed in a sidebar it stays cramped on a 1920px monitor and collapses nothing. Worse at 400% browser zoom, where the viewport reports a large CSS pixel count while every button is four times its normal size — the buttons overflow and the media query never fires, because the screen did not change.

### Attempt 2

> Use a ResizeObserver on the toolbar and hide buttons that no longer fit.

Measured each button's width inside the fitting loop, while that same loop was hiding buttons. Every hide changed the layout the next measurement read, so the result depended on iteration order and oscillated — the observer fired on the size change it had itself caused, hid one more, and looped. Widths have to be measured once with everything visible.

## Why this one is worth keeping

The zoom case is the one that makes this worth building rather than reaching for a breakpoint. At 400% zoom the viewport width in CSS pixels barely moves while every glyph quadruples, so a media-query toolbar overflows silently for exactly the users who need it most — and it cannot be reproduced by dragging a window. The implementation trap is a genuine feedback loop: measuring button widths inside the loop that hides buttons means each measurement reflects the previous hide, the ResizeObserver then fires on the size change it caused, and the toolbar walks itself down to one button. Measuring once, with everything visible, is what breaks the cycle.
