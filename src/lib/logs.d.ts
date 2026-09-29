/* See registry.d.ts: the loader stays JavaScript, the shape is declared here. */
export interface AgentLog {
  file: string;
  slug: string;
  week: string;
  n: number;
  task: string;
  agent: string;
  prompt: string;
  result: string;
  saved: string;
  raw: string;
}

export function allLogs(): AgentLog[];
