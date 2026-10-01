import { useMemo, useState } from 'react';

const DEFAULT_BEFORE = 'The sweep schedule clamps wing position against Mach number. Pilots may override the schedule, but the automatic mode exists because the optimum moves faster than a hand can follow it.';
const DEFAULT_AFTER = 'The sweep schedule programs wing position against Mach number and altitude. Pilots may override it at any time, but the automatic mode exists because the optimum moves faster than a hand can follow.';

type Op = ['same' | 'del' | 'ins', string];
export type DiffMode = 'inline' | 'split';
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

export interface WordDiffProps {
  /** Original text. */
  before?: string;
  /** Revised text. */
  after?: string;
  /** View shown first. */
  initialMode?: DiffMode;
  /** Label of the inline view button. */
  inlineLabel?: string;
  /** Label of the split view button. */
  splitLabel?: string;
  /** Fired when the view is switched. */
  onModeChange?: (mode: DiffMode) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function WordDiff({
  before = DEFAULT_BEFORE,
  after = DEFAULT_AFTER,
  initialMode = 'inline',
  inlineLabel = 'Inline',
  splitLabel = 'Split',
  onModeChange,
  className = '',
}: WordDiffProps) {
  const [mode, setMode] = useState<DiffMode>(initialMode);
  const ops = useMemo(() => diff(tokenise(before), tokenise(after)), [before, after]);
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
    <div className={`wd grid gap-[9px] ${className}`}>
      <div className="flex items-center gap-1.5">
        {(['inline', 'split'] as const).map((m) => (
          <button
            key={m} type="button" aria-pressed={mode === m}
            onClick={() => { if (m !== mode) { setMode(m); onModeChange?.(m); } }}
            className={`cursor-pointer rounded-full border px-[11px] py-[5px] font-sans text-[.76rem] active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 ${
              mode === m ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-transparent text-text-dim hover:border-accent hover:text-text'
            }`}
          >
            {m === 'inline' ? inlineLabel : splitLabel}
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
