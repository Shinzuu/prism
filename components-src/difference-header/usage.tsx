import DifferenceHeader, { type DifferencePanel } from './Component';

// Use it for a landing page whose sticky header must stay legible over light, dark and brand-coloured sections.
const panels: DifferencePanel[] = [
  { id: 'intro', ground: 'bg-bg text-text', copy: 'Plain sections first: the header reads dark.', nav: 'Intro' },
  { id: 'pricing', ground: 'bg-accent text-accent-fg', copy: 'The pricing band is brand colour, and the header inverts to match.', nav: 'Pricing' },
  { id: 'faq', ground: 'bg-text text-bg', copy: 'Dark footer band. No second header style needed.', nav: 'FAQ' },
];

export default function Example() {
  return (
    <DifferenceHeader
      brand="northwind"
      panels={panels}
      regionLabel="Product page sections"
      className="max-w-xl"
    />
  );
}
