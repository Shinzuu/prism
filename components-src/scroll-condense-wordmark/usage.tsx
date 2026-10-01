import ScrollCondenseWordmark, { type WordmarkLink } from './Component';

// Use it for a site header whose logo should tighten as the page scrolls without changing bar height.
const nav: WordmarkLink[] = [
  { label: 'Menu', href: '/menu' },
  { label: 'Book', href: '/book' },
];

export default function Example() {
  return (
    <ScrollCondenseWordmark
      brand="Halcyon"
      brandHref="/"
      links={nav}
      paragraphs={[
        'Seasonal tasting menu, served Thursday to Sunday.',
        'Private room for up to twelve guests.',
        'Walk-ins welcome at the bar from 5pm.',
      ]}
      condenseDistance={100}
      onCondense={(p) => document.documentElement.toggleAttribute('data-scrolled', p > 0.5)}
    />
  );
}
