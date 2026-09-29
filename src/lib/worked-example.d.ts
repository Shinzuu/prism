/* See registry.d.ts: the data stays JavaScript, the shape is declared here. */
export interface WorkedBlock {
  heading: string;
  lesson: string;
  why: string;
  lines: string[];
}
export interface WorkedExample {
  titleFor: (n: number) => string;
  standfirst: string;
  brief: string;
  blocks: WorkedBlock[];
  /** What the prompt did not prevent, where that is on the record. */
  cost?: string[];
}
export const WORKED_EXAMPLES: WorkedExample[];
export function workedExamples(): WorkedExample[];
