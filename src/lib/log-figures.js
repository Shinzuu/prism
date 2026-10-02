/* Figures for the agent logs.

   Only the logs that recorded real measurements get one. A chart is a claim,
   and a chart drawn from numbers nobody measured is a worse claim than a
   paragraph. Six of the twenty-one logs have the data; the rest carry none, and
   that is the honest outcome rather than a gap to fill.

   Every value here is quoted from the log text beside it. */

const FIGURES = {
  '01': {
    kind: 'pairs',
    title: 'One config default, measured before and after',
    note: 'A speech model was pinned in memory instead of loading on demand.',
    unit: 'MB',
    rows: [
      { label: 'voxtype resident', before: 1478, after: 5 },
      { label: 'voxtype swap', before: 2040, after: 1 },
      { label: 'system free', before: 1202, after: 2728, higherIsBetter: true },
    ],
  },

  '02': {
    kind: 'bars',
    title: 'Where the 5,638ms actually went',
    note: 'Two confident fixes moved it to 5,383ms and then 5,738ms. Neither touched the 3,658ms.',
    unit: 'ms',
    bars: [
      { label: 'buildString', value: 57 },
      { label: 'parseHTML', value: 610 },
      { label: 'forced layout', value: 3658, mark: true },
      { label: 'to paint', value: 916 },
    ],
  },

  '05': {
    /* Plotted as condensation achieved rather than as the raw ratio, so the
       bar agrees with the finding: a longer bar is more condensation, and the
       font with the widest nominal axis range has the shortest bar. The raw
       measurement stays in the label. */
    kind: 'bars',
    title: 'How far each font actually condenses',
    note: 'Narrowest rendered width against widest, measured in a browser. The widest nominal axis range condensed the least, by a factor of two. Archivo shipped.',
    unit: '%',
    bars: [
      { label: 'Roboto Flex  25–151  0.79×', value: 21 },
      { label: 'Encode Sans  75–125  0.77×', value: 23 },
      { label: 'Archivo  62–125  0.53×', value: 47, mark: true },
      { label: 'Saira  50–125  0.46×', value: 54 },
    ],
  },

  '06': {
    kind: 'pairs',
    title: 'What one getBoundingClientRect loop cost',
    note: 'The check measured every element on the page. Measuring only what can overflow its container left nine.',
    rows: [
      { label: 'elements measured', before: 250000, after: 9, unit: '' },
      { label: 'suite runtime', before: 600, after: 90, unit: 's', beforeLabel: 'killed at 10 min' },
    ],
  },

  '07': {
    kind: 'bars',
    title: 'Same rows, same containment, different box',
    note: 'A table box builds its own row grid by walking every row, so per-row containment cannot save it.',
    unit: 'ms',
    bars: [
      { label: 'table + content-visibility', value: 3367 },
      { label: 'div rows + content-visibility', value: 434, mark: true },
    ],
  },

  '13': {
    kind: 'pairs',
    title: 'The three measurements that changed a decision',
    note: 'Each one contradicted a fix that looked obviously right.',
    rows: [
      { label: 'endless-ledger paint', before: 5638, after: 1809, unit: 'ms' },
      { label: 'qa.mjs runtime', before: 600, after: 90, unit: 's', beforeLabel: 'never finished' },
      { label: 'wordmark condensation', before: 0.95, after: 0.54, unit: '×' },
    ],
  },
};

export function figureFor(week) {
  return FIGURES[week] ?? null;
}
