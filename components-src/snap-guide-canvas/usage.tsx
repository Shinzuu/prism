import SnapGuideCanvas, { type Box, type LabelledBox } from './Component';

// Use it in a layout editor where a dragged element should align with the ones already placed.
const cards: LabelledBox[] = [
  { label: 'Logo', x: 20, y: 18, w: 70, h: 48 },
  { label: 'Nav', x: 120, y: 18, w: 140, h: 48 },
  { label: 'CTA', x: 290, y: 18, w: 80, h: 48 },
];
const banner: Box = { x: 60, y: 110, w: 160, h: 64 };

export default function Example() {
  return (
    <SnapGuideCanvas
      blocks={cards}
      liveBlock={banner}
      liveLabel="Banner"
      snapTolerance={8}
      onMove={(pos, snaps) => console.log(pos, snaps || 'no snap')}
    />
  );
}
