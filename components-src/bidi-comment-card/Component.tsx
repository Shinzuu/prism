import { useState } from 'react';

export type BidiComment = {
  /** Author handle. */
  who: string;
  /** Paragraph direction of the body. */
  dir: 'ltr' | 'rtl';
  /** BCP 47 language of the body. */
  lang: string;
  body: string;
  likes: number;
  url: string;
};

const DEFAULT_COMMENTS: BidiComment[] = [
  { who: 'sara_k', dir: 'rtl' as const, lang: 'ar',
    body: 'هذا يبدو رائعًا، شكرًا لك!', likes: 12, url: 'example.com/specs' },
  { who: 'דניאל', dir: 'rtl' as const, lang: 'he',
    body: 'אני אבדוק את זה מחר בבוקר.', likes: 3, url: 'example.com/thread/8' },
  { who: 'm_torres', dir: 'ltr' as const, lang: 'en',
    body: 'Agreed — I will push the fix tonight.', likes: 7, url: 'example.com/pr/441' },
  { who: 'أحمد', dir: 'rtl' as const, lang: 'ar',
    body: 'النسخة 2.4 تعمل بشكل جيد على الإصدار 11.', likes: 21, url: 'example.com/v2-4' },
];

const DEFAULT_NOTE =
  'Every handle, URL and count above is isolated from the text around it. Tick the box to see '
  + 'what happens without it — the punctuation and the numbers jump to the wrong end of the line.';

export interface BidiCommentCardProps {
  /** Comments to render, each with its own direction and language. */
  comments?: BidiComment[];
  /** Heading above the thread. */
  title?: string;
  /** Unit shown after each like count. */
  likesLabel?: string;
  /** Label of the checkbox that switches isolation off. */
  toggleLabel?: string;
  /** Whether isolation starts switched off. */
  defaultRaw?: boolean;
  /** Hides the isolation checkbox, for production use where it is always on. */
  hideToggle?: boolean;
  /** Disables the isolation checkbox. */
  disabled?: boolean;
  /** Explanatory note under the thread; pass an empty string to hide it. */
  note?: string;
  /** Fired when the isolation checkbox changes, with true when isolation is off. */
  onRawChange?: (raw: boolean) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function BidiCommentCard({
  comments = DEFAULT_COMMENTS,
  title = 'Thread',
  likesLabel = 'likes',
  toggleLabel = 'Remove isolation',
  defaultRaw = false,
  hideToggle = false,
  disabled = false,
  note = DEFAULT_NOTE,
  onRawChange,
  className = '',
}: BidiCommentCardProps) {
  const [raw, setRaw] = useState(defaultRaw);

  return (
    <div className={`grid gap-2 ${raw ? 'bcc-raw' : ''} ${className}`}>
      <div className="flex items-center justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">{title}</p>
        {!hideToggle && (
          <label className={`flex items-center gap-[5px] text-[.68rem] text-text-dim ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-text'}`}>
            <input
              type="checkbox" checked={raw} disabled={disabled}
              onChange={(e) => { if (disabled) return; setRaw(e.target.checked); onRawChange?.(e.target.checked); }}
              className="focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed"
            />
            <span>{toggleLabel}</span>
          </label>
        )}
      </div>

      <ul className="m-0 grid list-none gap-1.5 p-0">
        {comments.map((c) => (
          <li key={c.who} className="grid gap-1 rounded-[9px] border border-border bg-bg px-[11px] py-[9px]">
            {/* <bdi> around each independently-authored string. The handle, the
                URL and the count each have their own direction, and none may
                reorder the sentence beside it. dir on a shared parent cannot
                do this — the runs still resolve against one another. */}
            <p className="m-0 flex flex-wrap items-baseline gap-2 text-[.68rem] text-text-dim">
              <bdi className="font-medium text-text">{c.who}</bdi>
              <bdi>{c.url}</bdi>
              <bdi>{`${c.likes} ${likesLabel}`}</bdi>
            </p>
            {/* dir on the element CARRYING the text: the paragraph direction is
                what decides which end the trailing full stop goes to. */}
            <p dir={c.dir} lang={c.lang} className="m-0 text-[.8rem] leading-loose">
              {c.body}
            </p>
          </li>
        ))}
      </ul>

      {note && <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">{note}</p>}
    </div>
  );
}
