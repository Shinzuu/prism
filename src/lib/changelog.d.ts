/* See registry.d.ts: the loader stays JavaScript, the shape is declared here. */
export interface ChangelogEntry {
  hash: string;
  kind: 'Added' | 'Fixed' | 'Faster' | 'Changed';
  text: string;
}

export interface ChangelogDay {
  date: string;
  entries: ChangelogEntry[];
}

export function changelog(): ChangelogDay[];
export function lastUpdated(): string | null;
