/* A prompt long enough to be worth reading in full, annotated with which of
   the ten lessons each part of it is an instance of.

   Five clauses in the paste arrived truncated — a belt-texture line, the
   cutaway toggle, the material list, the default camera and the last toggle
   group. They are completed here to the obvious reading; everything else is
   verbatim. */

export const WORKED_EXAMPLE = {
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

export function workedExample() {
  return WORKED_EXAMPLE;
}
