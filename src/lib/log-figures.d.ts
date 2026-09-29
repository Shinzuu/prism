/* See registry.d.ts: the data stays JavaScript, the shape is declared here. */
export interface FigureBar { label: string; value: number; mark?: boolean }
export interface FigureRow {
  label: string; before: number; after: number;
  unit?: string; beforeLabel?: string; higherIsBetter?: boolean;
}
export interface Figure {
  kind: 'bars' | 'pairs';
  title: string;
  note?: string;
  unit?: string;
  scale?: number;
  bars?: FigureBar[];
  rows?: FigureRow[];
}
export function figureFor(week: string): Figure | null;
