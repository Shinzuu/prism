import { execFileSync } from 'node:child_process';

/* The changelog is the git history, read at build time. Nothing to keep in step
   by hand: a commit that ships is a commit that shows. Commits that only touch
   the test harness or tooling are left out, because they change nothing a
   visitor can see. */
const KIND = { feat: 'Added', fix: 'Fixed', perf: 'Faster', refactor: 'Changed', style: 'Changed' };
const HIDDEN = new Set(['test', 'chore', 'docs', 'ci', 'build']);
const SEP = '\x1f';

let cached;
export function changelog() {
  if (cached) return cached;
  // Throw rather than ship an empty page: no git here means the build is wrong.
  const out = execFileSync('git', ['log', '--no-merges', '--date=short', `--format=%H${SEP}%ad${SEP}%s`], {
    encoding: 'utf8',
  });

  const days = new Map();
  for (const line of out.split('\n')) {
    if (!line) continue;
    const [hash, date, subject] = line.split(SEP);
    const m = /^(\w+)(?:\([^)]*\))?!?:\s*(.+)$/.exec(subject);
    const type = m ? m[1].toLowerCase() : '';
    if (HIDDEN.has(type)) continue;
    const text = (m ? m[2] : subject).replace(/^"(.*)"$/, "$1");
    const entry = {
      hash: hash.slice(0, 7),
      kind: KIND[type] ?? 'Changed',
      text: text.charAt(0).toUpperCase() + text.slice(1),
    };
    if (!days.has(date)) days.set(date, []);
    days.get(date).push(entry);
  }
  cached = [...days].map(([date, entries]) => ({ date, entries }));
  return cached;
}

/* Newest day with a visible change. The footer stamp and the page agree because
   they read the same list. */
export function lastUpdated() {
  return changelog()[0]?.date ?? null;
}
