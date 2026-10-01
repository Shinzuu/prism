import PanZoomCanvas, { type CanvasNode } from './Component';

// A small org chart or pipeline diagram that is larger than its panel.
const steps: CanvasNode[] = [
  { label: 'Ingest', x: 60, y: 80 },
  { label: 'Validate', x: 340, y: 80 },
  { label: 'Publish', x: 620, y: 260 },
];

export default function Example() {
  return (
    <PanZoomCanvas
      nodes={steps}
      links="M150 100 L340 100 M440 110 L620 270"
      maxZoom={2}
      fitLabel="reset"
      onViewChange={(view) => console.log(`zoom ${Math.round(view.k * 100)}%`)}
    />
  );
}
