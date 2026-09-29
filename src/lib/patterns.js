import { allComponents } from './registry.js';

/* Seventy components produced 140 recorded failed attempts and seventy
   post-mortems. These are the lessons that recurred in more than one of them.
   Each is stated as a rule, then evidenced by the components where ignoring it
   cost an attempt — the evidence is the argument, so a lesson with one example
   does not belong here. */
const LESSONS = [
  {
    id: 'name-the-pattern',
    title: 'Name the pattern, not the appearance',
    claim: [
      `A description of how something looks is satisfied by the cheapest thing that looks like it. "Sliding indicator" is satisfied by a crossfade. "Command palette" is satisfied by a text input above a filtered list. Both pass a screenshot and fail in use.`,
      `Established interaction patterns have names, and the names carry the behaviour: combobox, roving tabindex, FLIP, bullet chart. Naming the pattern transfers a specification in two words. Where the pattern has no name, transcribe the contract instead — eleven keys, each with its job — because a component that reimplements something people already know has to match what they know.`,
    ],
    evidence: [
      ['command-palette', 'Naming the combobox pattern stopped focus being moved onto options.'],
      ['segment-nav', '"Sliding indicator" produced a crossfade until the movement was named as the point.'],
      ['bullet-chart', 'The chart type is well documented and still produced a progress bar; three sentences of proportion produced the form.'],
      ['spreadsheet-grid', 'Enter commits and drops, Tab commits and moves right — a model asked for "keyboard navigation" makes them the same.'],
      ['scroll-condense-wordmark', 'A width axis is a redrawing problem; scaleX is a matrix multiply over the designer’s judgement.'],
    ],
  },
  {
    id: 'invisible-behaviour',
    title: 'The invisible behaviours are never volunteered',
    claim: [
      `Anything that cannot be seen in a still frame gets omitted: focus returning to the opener on close, the resting state of a pointer-driven effect, whether the first placement animates, what the control does before anyone has touched it.`,
      `These are not polish. They are the difference between a component that feels built and one that feels generated, and none of them are discovered by asking for polish. They have to be stated as requirements, with the reason attached, because the reason is what survives a later refactor.`,
    ],
    evidence: [
      ['spotlight-card', 'An effect that depends on a pointer has no appearance without one — it must survive a screenshot.'],
      ['command-palette', 'Focus returning to the trigger closes the loop that otherwise strands a keyboard user after Escape.'],
      ['segment-nav', 'No animation on first placement; never volunteered, and immediately visible once wrong.'],
      ['slide-confirm', 'The transition has to be scoped to the settling state or the grip lags the pointer.'],
    ],
  },
  {
    id: 'enumerate-the-inputs',
    title: 'Enumerate the input methods, not the control',
    claim: [
      `A control is a single object with several independent paths through it. Typing, pasting, autofilling and correcting are four different code paths in one text field, and a model will implement the first and call it finished.`,
      `The same applies across devices and input methods rather than only across events. A pen reports pressure and a mouse reports a constant, an IME fires composition events the keyboard path never sees, and a deliberate gesture has no honest keyboard equivalent that is a single keypress. Listing the paths is more reliable than describing the widget.`,
    ],
    evidence: [
      ['code-input', 'iOS delivers a whole SMS code into one input; undiscoverable on a desktop, three lines once stated.'],
      ['ime-search-field', 'Correct in English, five wasted requests per word in Chinese — and the naive composition guard still leaks one in Safari.'],
      ['pressure-signature-pad', 'e.pressure always returns a number, so a mouse silently flattens the effect with no error to notice.'],
      ['slide-confirm', 'Asked for keyboard support, a model reaches for Enter — the exact press the component exists to prevent.'],
      ['radial-menu', 'The keyboard path is a different interaction, not a simulated drag.'],
    ],
  },
  {
    id: 'forbid-the-shortcut',
    title: 'Forbidding an implementation beats describing one',
    claim: [
      `Some mistakes are cheaper to rule out than to correct. Saying "do not render inputs, make the cell contenteditable" removes tab-order pollution, focus restoration and a forty-control performance problem in one clause, none of which would have been worth enumerating.`,
      `This works because the shortcut usually passes a casual test. Index comparison looks like a diff until something is inserted; rewriting innerHTML looks like a highlighter until it destroys the listeners in the subtree. Naming why the shortcut fails makes it unusable rather than merely discouraged.`,
    ],
    evidence: [
      ['spreadsheet-grid', 'One prohibition removed three unrelated classes of bug at once.'],
      ['word-diff', 'Inserting one word shifts every later index — stated, the shortcut stops being tempting.'],
      ['highlight-search', '"Never insert or modify a single DOM node" makes the highlight API inevitable.'],
      ['reading-rail', 'IntersectionObserver answers a different question than the one being asked, so a patch is always another special case.'],
    ],
  },
  {
    id: 'silent-failure',
    title: 'When the failure is silence, name the cause',
    claim: [
      `A whole class of modern CSS fails with no error, no warning and nothing in the inspector — it simply does nothing. An unregistered custom property is a string, and strings do not interpolate. A background defeats a blend mode. A mask over a blur removes the layer rather than weakening it.`,
      `Developers meet these once, conclude the technique does not work, and reach for a library. Stating the cause alongside the technique is the entire difference between a working component and an abandoned experiment, and none of it is discoverable by reading the failing code.`,
    ],
    evidence: [
      ['marching-ants', '@property registration: without it the value snaps and nothing reports why.'],
      ['weight-shift-button', 'Two silent failures stacked — transitioning the shorthand, then unregistered properties.'],
      ['difference-header', 'Two declarations almost nobody ships, because the effect appears to do nothing.'],
      ['progressive-blur-sheet', 'A masked blur shows the sharp page through, which reads as broken rather than graduated.'],
      ['column-resizer', 'table-layout: fixed — the symptom reads as a maths bug and is the browser balancing widths.'],
    ],
  },
  {
    id: 'state-the-invariant',
    title: 'State the invariant, not the feature',
    claim: [
      `A feature request is satisfied by the first thing that provides the feature, including versions that will be wrong in three months. A shortcut sheet containing a hardcoded list works perfectly and is worthless, because the list and the bindings drift apart immediately.`,
      `An invariant rules out the half-measures as well as the obvious failure. "A binding cannot exist without appearing here" forces registration from the DOM and also forbids a registry the sheet can override. "Adding an item must require no recalculation" produces a CSS-driven geometry without anyone naming the technique.`,
    ],
    evidence: [
      ['shortcut-sheet', 'The invariant forces the sheet to read the DOM, and rules out the registry that drifts.'],
      ['radial-menu', 'Stating the constraint produced the custom-property design without naming it.'],
      ['bullet-chart', '"Moving one threshold must not require recalculating another" produced the layered solution.'],
      ['scroll-filmstrip', '"Assume the animation will not run and the section must still read" put @supports in the right place.'],
      ['adjust-last-action', 'Writing the action as a pure function of a snapshot makes the correct behaviour the only available one.'],
    ],
  },
  {
    id: 'say-what-it-does-when-it-does-not-know',
    title: 'Specify what it does when it does not know',
    claim: [
      `Asked for an estimate, a model produces an estimate. The honest answer — that the data does not support one yet, that this conversion depends on a container nobody has specified, that the popup was blocked — has to be specified as an outcome or it never appears.`,
      `Make the threshold testable. "Coefficient of variation above 0.55" is implementable; "when the estimate seems unreliable" produces a vague heuristic or nothing at all. That branch is where a component's honesty lives, and it is the branch nobody asks for.`,
    ],
    evidence: [
      ['queue-position', 'The instruction to refuse is what made the component worth building.'],
      ['unit-field', 'Show the conversions that exist and say plainly that the rest depend on context.'],
      ['tear-off-panel', 'window.open returns null and throws nothing, so the commonest outcome is indistinguishable from a bug.'],
      ['infinite-drag-field', 'Telling the user which mode is active costs one line and stops the fallback reading as broken.'],
      ['staged-pipeline', 'Measured elapsed time rather than the configured duration — the measured figure is the useful one.'],
    ],
  },
  {
    id: 'measurement-is-about-when',
    title: 'Measurement bugs are about when, not how',
    claim: [
      `The formula for a position is rarely wrong. What is wrong is how many moments it is recomputed at, and which moment it is read in. First paint, font load, container resize, strip scroll — list them and the code is correct immediately; ask to "fix the measurement" and you get a window resize listener that misses most of them.`,
      `The reading side has the same shape. offsetTop is blind to transforms, so it reports the wrong origin exactly when a user is moving quickly. A loop finishing is not the browser having painted. Measuring inside the loop that changes the thing being measured is a feedback cycle, not a measurement.`,
    ],
    evidence: [
      ['segment-nav', 'Four moments named explicitly; the formula never changed.'],
      ['priority-overflow-toolbar', 'Measuring inside the hide loop walks the toolbar down to one button.'],
      ['shared-field-steps', 'offsetTop is blind to transforms, which is when FLIP needs it most.'],
      ['sliding-pane-stack', 'Scrolling in the same tick as the insert reads the old scrollWidth and lands short.'],
      ['endless-ledger', 'Measuring before document.fonts.ready reported 6,250ms, of which 3,468ms was a font fetch.'],
    ],
  },
  {
    id: 'the-standard-fix-is-also-wrong',
    title: 'The standard fix is often also wrong',
    claim: [
      `Everyone knows not to write "Uploading 1 files", and the reflex repair — a ternary on n === 1 — hardcodes the assumption that every language has two number forms. Translating afterwards propagates that assumption into languages that need three or six.`,
      `The pattern recurs: a hover menu gets a close delay, which cannot be tuned because the right value is a property of someone's hand; an accessible encoding is added inside the media query that needs it, so it is written, shipped and broken at once. Ask what the repair assumes before adopting it.`,
    ],
    evidence: [
      ['localized-progress-loader', 'Key on the plural category so the language decides how many forms exist.'],
      ['safe-triangle-hover', 'A geometric question has an exact answer; a timing heuristic has a tuning problem forever.'],
      ['forced-colors-chart', 'Redundant encoding has to be visible in the default view to stay correct.'],
      ['collation-sort-table', 'localeCompare is nearly right and still builds a collator per comparison against an accidental locale.'],
      ['infinite-drag-field', 'Pointer Lock is the correct tool and makes a clientX scrubber completely dead.'],
    ],
  },
  {
    id: 'ship-the-table',
    title: 'For a chart, ship the table',
    claim: [
      `Making a graphic itself readable to assistive technology produces a pile of aria-label noise and a worse result. A chart is a picture of a table: mark the graphic as decoration, put the real table in the document, and give each row one honest sentence.`,
      `It is faster to implement than any attempt at the alternative, and it recurred in four charts in this library before it was worth writing down as a rule rather than rediscovering per chart. The generalisation beyond charts: name which part is decoration, then state the fact once, in text.`,
    ],
    evidence: [
      ['bullet-chart', 'Saying what not to attempt got a real table and one summary per row.'],
      ['ridgeline-plot', 'The third time the answer was the same; at that point it is a rule.'],
      ['quantile-dots', 'The sentence is the component, the picture is how you check it.'],
      ['heatmap-calendar', 'title is not an accessibility mechanism — invisible to keyboards, unusable on touch.'],
      ['sparkline-table', 'Name the decoration, then state the fact once in text.'],
    ],
  },
];

export function allPatterns() {
  const byslug = new Map(allComponents().map((c) => [c.slug, c]));
  return LESSONS.map((l) => ({
    ...l,
    evidence: l.evidence.map(([slug, note]) => {
      const c = byslug.get(slug);
      /* An evidence link to a component that no longer exists is a broken
         argument as well as a broken link, so it stops the build. */
      if (!c) throw new Error(`\n\n  prism: pattern "${l.id}" cites unknown component "${slug}".\n`);
      return { slug, note, name: c.name, type: c.type };
    }),
  }));
}
