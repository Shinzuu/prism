# Radial Press Menu

- **Element ID:** `radial-menu`
- **Type:** button
- **Live:** https://prism.shinzuu-dev.workers.dev/components/radial-menu
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/radial-menu.json

Press and hold opens a wheel of actions under the pointer; release on one fires it. Every option sits the same distance from your hand, which is the whole argument for a wheel over a list.

## Final prompt

```
Build a radial press menu in plain HTML, CSS and vanilla JavaScript, no dependencies.

The interaction is one continuous gesture: press and hold on the anchor for about 220ms, the wheel opens centred on the press point, drag toward an option to arm it, release to fire it. Not press, release, then click again — the single gesture is the reason this control exists.

Call setPointerCapture on pointerdown. Without it the pointer leaving the anchor stops delivering move events and the armed option freezes, which is the failure this component is most prone to.

Place items with CSS, not JavaScript geometry. Give each item an --a custom property for its angle and animate a shared --r radius from zero, using transform: rotate(var(--a)) translate(var(--r)) rotate(calc(var(--a) * -1)) so the label stays upright while orbiting. JavaScript sets one angle per item at startup and one radius on open. Adding an item must require no recalculation.

Start the first item at twelve o'clock and proceed clockwise.

Implement a dead zone of about 26 pixels around the press point where nothing is armed, so releasing without committing cancels. Arming is decided by the angle from the press point to the pointer, not by hit-testing the elements — the wedge extends past the label, so a user aiming roughly in a direction gets that option.

The keyboard path is a different interaction, not a translation of the gesture. Enter or Space opens the wheel below the anchor and focuses the first item; arrow keys in any direction walk the ring and wrap; Enter fires; Escape closes and returns focus to the anchor. Do not attempt to simulate a drag.

Use role="menu" on the wheel and role="menuitem" on the items, aria-haspopup and aria-expanded on the anchor, and announce the chosen action through a role="status" element. Set touch-action: none on the anchor so the browser does not steal the drag for scrolling.

Emit a bubbling CustomEvent named rm:select carrying the chosen action.

Under prefers-reduced-motion: reduce, drop the orbit transition and fade only.

Colour comes only from CSS custom properties: var(--bg), var(--surface), var(--border), var(--text), var(--text-dim), var(--accent), var(--accent-fg). No literal hex, rgb or hsl values.
```

## What failed first

### Attempt 1

> Build a radial menu that opens when you press and hold a button.

Opened on click, not on hold, and required a second click to choose — which throws away the entire point. The items were absolutely positioned with hand-computed left and top values from sine and cosine in JavaScript, so nothing could animate and adding a seventh item meant recomputing all of them. Release anywhere fired whatever was nearest, including when the pointer had not left the centre, so letting go to cancel selected something.

### Attempt 2

> Make it a real press-drag-release gesture with a dead zone.

The gesture worked, then broke the moment the pointer left the button, because there was no pointer capture: moving away from the anchor stopped the move events and the selection froze on whatever was armed last. Keyboard users had nothing at all — the whole component hung off pointer events, and a wheel of options with no keyboard path is not a menu, it is a decoration.

## Why this one is worth keeping

Three separate lessons, and the cheapest one first: setPointerCapture. Any drag that can leave its origin element needs it, and its absence produces a bug that only appears when the user does the natural thing. Naming the API in the prompt is far more reliable than describing the symptom.

The second is about where geometry should live. The first attempt put trigonometry in JavaScript and got a component that could not animate and could not be extended. Moving the angle into a custom property and the radius into a transition means CSS owns the motion and the maths happens once. Stating the constraint as adding an item must require no recalculation produced that design without my naming the technique.

The third matters most. Asking for keyboard support on a gesture-driven control invites a simulated drag, which is always bad. Saying the keyboard path is a different interaction, then specifying it separately, gets two interactions that each suit their input rather than one that suits neither.
