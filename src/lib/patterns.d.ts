/* See registry.d.ts: the loader stays JavaScript, the shape is declared here. */
import type { ComponentType } from './registry';

export interface PatternEvidence {
  slug: string;
  name: string;
  type: ComponentType;
  note: string;
}

export interface Pattern {
  id: string;
  title: string;
  claim: string[];
  evidence: PatternEvidence[];
}

export function allPatterns(): Pattern[];
