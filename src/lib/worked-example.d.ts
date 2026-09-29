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
}
export const WORKED_EXAMPLE: WorkedExample;
export function workedExample(): WorkedExample;
