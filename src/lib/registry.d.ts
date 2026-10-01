/* registry.js is plain JavaScript because it runs at build time and is read as
   often as it is imported. This declaration gives the TypeScript endpoints the
   shape without turning the module itself into a compilation step. */
export type ComponentType =
  | 'button' | 'form' | 'card' | 'modal' | 'navbar'
  | 'table' | 'loader' | 'section' | 'chart' | 'input';

export interface Attempt {
  prompt: string;
  problem: string;
}

export interface Prop {
  name: string;
  optional: boolean;
  type: string;
  doc: string;
}

export interface Component {
  slug: string;
  name: string;
  type: ComponentType;
  week: number;
  date: string;
  summary: string;
  finalPrompt: string;
  attempts: Attempt[];
  why: string;
  html: string;
  css: string;
  js: string;
  tsx: string;
  hasTsx: boolean;
  usage: string;
  props: Prop[];
  repoPath: string;
}

export interface PlannedComponent {
  slug: string;
  name: string;
  type: ComponentType;
  week: number;
  planned: true;
  summary?: string;
}

export function allComponents(): Component[];
export function plannedComponents(): PlannedComponent[];
export const COMPONENT_TYPES: ComponentType[];
