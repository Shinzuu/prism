import { useMemo, useState } from 'react';

const A = 'The sweep schedule clamps wing position against Mach number. Pilots may override the schedule, but the automatic mode exists because the optimum moves faster than a hand can follow it.';
const B = 'The sweep schedule programs wing position against Mach number and altitude. Pilots may override it at any time, but the automatic mode exists because the optimum moves faster than a hand can follow.';

type Op = ['same' | 'del' | 'ins', string];
const tokenise = (s: string) => s.match(/\S+\s*/g) ?? [];

/* Word-level diff. A line diff marks a whole sentence changed when one word
   moved, which hides the edit inside the noise. This is the classic longest
   common subsequence over word tokens — the texts here are paragraphs, not
   files, so the quadratic table is fine. */
function diff(a: string[], b: string[]): Op[] {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i]![j] = a[i]!.trim() === b[j]!.trim()
        ? dp[i + 1]![j + 1]! + 1
        : Math.max(dp[i + 1]![j]!, dp[i]![j + 1]!);

  const ops: Op[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i]!.trim() === b[j]!.trim()) { ops.push(['same', a[i]!]); i++; j++; }
    else if (dp[i + 1]![j]! >= dp[i]![j + 1]!) { ops.push(['del', a[i]!]); i++; }
    else { ops.push(['ins', b[j]!]); j++; }
  }
  while (i < m) ops.push(['del', a[i++]!]);
  while (j < n) ops.push(['ins', b[j++]!]);
  return ops;
}

export default function WordDiff() {
  const [mode, setMode] = useState<'inline' | 'split'>('inline');
  const ops = useMemo(() => diff(tokenise(A), tokenise(B)), []);
  const added = ops.filter((o) => o[0] === 'ins').length;
  const removed = ops.filter((o) => o[0] === 'del').length;

  const pane = (side: 'a' | 'b') => (
    <div className="rounded-[9px] border border-border bg-surface px-[14px] py-3 text-[.86rem] leading-relaxed">
      {ops.map(([kind, text], i) => {
        // In split view each side shows only its own changes.
        if (mode === 'split' && ((side === 'a' && kind === 'ins') || (side === 'b' && kind === 'del'))) return null;
        if (kind === 'same') return <span key={i}>{text}</span>;
        const Tag = kind === 'ins' ? 'ins' : 'del';
        return (
          // Screen readers get the change type in words, not a visual style.
          <Tag key={i} aria-label={`${kind === 'ins' ? 'added' : 'removed'}: ${text.trim()}`}>{text}</Tag>
        );
      })}
    </div>
  );

  return (
    <div className="wd grid gap-[9px]">
      <div className="flex items-center gap-1.5">
        {(['inline', 'split'] as const).map((m) => (
          <button
            key={m} type="button" aria-pressed={mode === m} onClick={() => setMode(m)}
            className={`cursor-pointer rounded-full border px-[11px] py-[5px] font-sans text-[.76rem] ${
              mode === m ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-transparent text-text-dim'
            }`}
          >
            {m === 'inline' ? 'Inline' : 'Split'}
          </button>
        ))}
        <span className="ms-auto font-mono text-[.72rem] tabular-nums text-text-dim">+{added} −{removed} words</span>
      </div>

      <div className={`grid gap-[9px] ${mode === 'split' ? 'grid-cols-2' : ''}`}>
        {pane('a')}
        {mode === 'split' && pane('b')}
      </div>
    </div>
  );
}
