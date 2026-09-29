/* A prompt long enough to be worth reading in full, annotated with which of
   the ten lessons each part of it is an instance of.

   Five clauses in the paste arrived truncated — a belt-texture line, the
   cutaway toggle, the material list, the default camera and the last toggle
   group. They are completed here to the obvious reading; everything else is
   verbatim. */

const MECHANISM = {
  /* The title counts the lessons the prompt actually cites, computed from
     the blocks below so it cannot drift from them. */
  titleFor: (n) => `One prompt, ${n} of these lessons`,
  standfirst:
    'Nothing below is about 3D. It is what a prompt looks like when every lesson on this page has already been applied — a brief that states the pattern, forbids the shortcuts, names the invariant, and says what to do when the answer is bad.',
  brief: 'Build an interactive, animated 3D model of <MECHANISM: e.g. "a 20:1 belt reduction with two DC motors driving a plywood disc"> as ONE self-contained HTML file I can open locally in Chrome.',
  blocks: [
    {
      heading: 'Stack (use exactly this, nothing to install)',
      lesson: 'forbid-the-shortcut',
      why: 'Naming the exact versions and forbidding a build step removes a whole class of answer — npm, a bundler, a missing asset — rather than correcting it afterwards.',
      lines: [
        'three.js 0.170 via an importmap from cdn.jsdelivr.net',
        '  ("three" -> build/three.module.js, "three/addons/" -> examples/jsm/)',
        'OrbitControls (with damping) for orbit/pan/zoom',
        'CSS2DRenderer for HTML labels pinned to parts',
        'EffectComposer + UnrealBloomPass only if it helps readability; keep it subtle',
        'No build step, no npm, no external assets: textures drawn on <canvas> at runtime',
      ],
    },
    {
      heading: 'Geometry must be real, not eyeballed',
      lesson: 'state-the-invariant',
      why: '"Real, not eyeballed" is an invariant, and it rules out the plausible-looking version as well as the obviously wrong one. Putting every number in one block makes it checkable.',
      lines: [
        'Work in millimetres. Put every design number (diameters, tooth counts, pitch, centre',
        'distances, ratios) in one constants block at the top.',
        'Compute derived geometry in code: belt/chain paths from tangent lines + wrap arcs between',
        'circles, gear pitch radii from module × teeth, linkage positions from real kinematics.',
      ],
    },
    {
      heading: 'Report the numbers, and refuse the bad ones',
      lesson: 'say-what-it-does-when-it-does-not-know',
      why: 'The sanity rule is the whole clause. Without it the model renders a mechanism that cannot work and looks fine doing it.',
      lines: [
        'Report computed values in a stats panel (ratio, lengths, wrap angle, teeth in mesh,',
        'forces at a given torque) and flag anything that fails a sanity rule',
        '(e.g. <6 teeth in mesh).',
      ],
    },
    {
      heading: 'Animation quality',
      lesson: 'measurement-is-about-when',
      why: 'One master angle is an invariant about state. Frame-rate independence is the timing half — a model driven by frame count is right on the machine that built it and wrong everywhere else.',
      lines: [
        'One master angle drives everything; every part’s motion is derived from it through the',
        'real ratios (gears counter-rotate, belts move at surface speed, idlers spin at v/r).',
        'Belts/chains: animate a repeating tooth texture along the belt path at the same surface',
        'speed as the pulleys it wraps.',
        'Frame-rate independent (use clock delta, clamp dt). Ease between modes, no jumps.',
        'Modes: continuous spin, oscillating "real use" motion (sum of a few sines), and',
        'step-through (slow motion + pause).',
        'Exploded view slider that moves sub-assemblies apart.',
        'Optional: cutaway / section plane toggle (renderer.clippingPlanes), ghost housings',
        '(transparent, depthWrite off), click a part to highlight it and show its numbers.',
      ],
    },
    {
      heading: 'Look',
      lesson: 'invisible-behaviour',
      why: 'The default camera is the resting state. A model that only reads well after the reader has orbited it is a model most readers never see.',
      lines: [
        'MeshStandardMaterial with believable metalness/roughness per material (steel, aluminium,',
        'plywood, rubber). Hemisphere light + key + fill + a low rim light; soft shadows on a',
        'ground plane.',
        'Light/dark theme from prefers-color-scheme, via CSS variables.',
        'Floating control panel (top-left), collapses to a bottom sheet on narrow screens.',
        'Default camera is a 3/4 view where the key interaction is visible without orbiting.',
        'Add buttons for preset views (front, side, top, detail on <PART>).',
      ],
    },
    {
      heading: 'Controls',
      lesson: 'enumerate-the-inputs',
      why: 'Listing the controls, in the units they are read in, is the difference between a speed slider and a slider that reads in output RPM.',
      lines: [
        'play/pause, speed slider (in real units such as output RPM), mode buttons,',
        'exploded slider, toggles for labels / housings / each sub-assembly.',
      ],
    },
    {
      heading: 'Deliverable',
      lesson: 'say-what-it-does-when-it-does-not-know',
      why: 'Asking for the problems the model revealed turns the build into a check on the design, which is the only reason to model a mechanism rather than draw one.',
      lines: [
        'The single .html file, then a short list of the numbers it computed and any design',
        'problems the model revealed.',
      ],
    },
  ],
};


/* The second is the brief that produced the drawing at the top of this site.
   It is here because its outcome is checkable: the thing it asked for exists,
   and the three ways it went wrong are recorded rather than described.

   Four clauses arrived truncated in the paste and are completed to the obvious
   reading: the timeline's idle state, the draw-on mechanism, the camera blend,
   and the last two deliverables. */
const HERO = {
  titleFor: (n) => `A second prompt, ${n} of these lessons`,
  standfirst:
    'This one produced the drawing at the top of this page, so what it got right and wrong is on the record rather than asserted. Note how much of it is refusal: no literal colours, no orbit controls, no triangle-soup wireframe, no build step.',
  brief: 'Build a hero-section animation: a 3D wireframe of a variable-geometry fighter, drawn like an engineering general-arrangement sheet coming to life. It replaces the current static SVG hero (side elevation, plan view, front elevation, 19.10 m length, 11.65 m swept span, sweep 20° MIN / 68° MAX, SCALE 1:96, THIRD ANGLE, callouts 01 radar, 02 cockpit, 03 engines, 04 hardpoints, 05 wing).',
  blocks: [
    {
      heading: 'Stack and constraints',
      lesson: 'forbid-the-shortcut',
      why: 'Every line here removes an option rather than adding one. The colour rule is the sharpest: forbidding literal colours and naming where they must come from instead is what made a theme switch work without a second pass.',
      lines: [
        'Astro site, React + TypeScript island, Tailwind. GSAP is already in the bundle (use it',
        'for the timeline + ScrollTrigger); three.js for the 3D.',
        'Colour rule: no literal colours anywhere. Read every colour from existing CSS custom',
        'properties at runtime (getComputedStyle) and re-read when the theme toggles.',
        'Render only on the client (client:visible), and lazy-load three.js.',
        'Performance budget: under 150 KB gzipped of extra JS, 60 fps on a mid laptop. Cap DPR',
        'at 2. Pause the render loop when off-screen (IntersectionObserver) and when the tab is',
        'hidden.',
      ],
    },
    {
      heading: 'Model',
      lesson: 'state-the-invariant',
      why: '"The wings MUST be separate meshes that pivot at the real pivot points so the sweep is animated, not faked" is an invariant, and it rules out the cheap version that looks the same in a still.',
      lines: [
        'Source a CC-licensed glTF/GLB (credit it in the page footer). If none fits, build a',
        'clean low-poly model in code from lofted cross-sections. The wings MUST be separate',
        'meshes that pivot at the real glove pivot points so the sweep is animated, not faked.',
        'Real proportions: length 19.10 m, span 19.54 m at 20° sweep, 11.65 m at 68°.',
      ],
    },
    {
      heading: 'Line work',
      lesson: 'name-the-pattern',
      why: 'Naming EdgesGeometry, a crease angle and LineSegments2 transfers a whole rendering approach in one line. "Make it look like a wireframe" gets triangle soup, which is what the clause explicitly forbids.',
      lines: [
        'Use EdgesGeometry (crease angle ~15–25°) for clean panel/outline lines. No',
        'triangle-soup wireframe. Use LineSegments2 / LineMaterial for consistent pixel widths.',
        'Hidden-line look: a depth-only prepass of the solid mesh. Visible edges get full ink;',
        'occluded edges get a faint dashed line, like hidden lines on a drawing.',
      ],
    },
    {
      heading: 'Animation',
      lesson: 'measurement-is-about-when',
      why: 'The draw-on clause specifies the mechanism, not the look: a progress uniform against a per-vertex distance, "so strokes grow nose-to-tail rather than fading in". Asked for the look alone, a model tweens opacity and the result dissolves.',
      lines: [
        'One GSAP master timeline, about 6 s, then an idle loop.',
        '1. Blueprint grid + title block draw in (the existing sheet furniture).',
        '2. The aircraft draws itself: a per-vertex distance-along-body attribute against a',
        '   progress uniform in the line shader, so strokes grow nose-to-tail rather than',
        '   fading in.',
        '3. The camera eases from an orthographic plan view to a three-quarter view, blending',
        '   orthographic and perspective with a matrix lerp, so there is no jump.',
        '4. The wings sweep 20° -> 68° -> 20°, with the dimension staying live',
        '   (11.65 m <-> 19.54 m) as an HTML/SVG label projected from 3D points.',
        '5. Callouts 01–05 appear one by one with leader lines anchored to 3D points',
        '   (reprojected each frame), each ticking a counter.',
        '6. Idle: a slow turntable of a few degrees plus a subtle drift. The wing sweep',
        '   responds to scroll progress via ScrollTrigger (scroll down = sweep back).',
      ],
    },
    {
      heading: 'Interaction and accessibility',
      lesson: 'invisible-behaviour',
      why: 'The reduced-motion state and the fallback are both invisible in a screenshot, so neither is ever volunteered. Naming what the finished drawing looks like when nothing moves is what makes the page work with the animation switched off.',
      lines: [
        'Pointer parallax of a few degrees max. No orbit controls.',
        'prefers-reduced-motion: render the finished drawing statically, no sweep, no drift.',
        'Keep the key text as real HTML (not in the canvas); the existing SVG remains as the',
        'no-JS / no-WebGL fallback.',
      ],
    },
    {
      heading: 'Deliverables',
      lesson: 'say-what-it-does-when-it-does-not-know',
      why: 'Asking for the tuning knobs and how each colour token is used turns a delivery into something a second person can change. Without it the numbers that matter stay buried in whichever line first needed them.',
      lines: [
        'The React component, the shader(s), and the model-building code.',
        'A short note of the tuning knobs (crease angle, line widths, timeline durations) and',
        'how each colour token is used.',
      ],
    },
  ],
  /* What the prompt did not prevent. Kept because a worked example that only
     shows the wins is an advertisement. */
  cost: [
    'Every line came out invisible. The palette is OKLCH, and three\u2019s Color.set() parses hex, rgb(), hsl() and the named colours and nothing else \u2014 an oklch() string leaves the material white, with no error. The colour rule was right and still needed a resolver that paints one pixel and reads it back.',
    'The canvas sized itself to the whole document. Astro scopes a component\u2019s styles onto the elements in its own template, and the island\u2019s nodes are made by React at runtime, so none of the scoped rules reached them.',
    'The bundle came in at 166 KB gzipped against a 150 KB budget, because a namespace import is opaque to the bundler and nothing can be dropped. Re-exporting the fifteen symbols actually used brought it to 115 KB. The budget was worth stating: without the number, nobody measures.',
  ],
};

export const WORKED_EXAMPLES = [MECHANISM, HERO];

export function workedExamples() {
  return WORKED_EXAMPLES;
}
