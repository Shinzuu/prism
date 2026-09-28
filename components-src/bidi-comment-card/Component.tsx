import { useState } from 'react';

const COMMENTS = [
  { who: 'sara_k', dir: 'rtl' as const, lang: 'ar',
    body: 'هذا يبدو رائعًا، شكرًا لك!', likes: 12, url: 'example.com/specs' },
  { who: 'דניאל', dir: 'rtl' as const, lang: 'he',
    body: 'אני אבדוק את זה מחר בבוקר.', likes: 3, url: 'example.com/thread/8' },
  { who: 'm_torres', dir: 'ltr' as const, lang: 'en',
    body: 'Agreed — I will push the fix tonight.', likes: 7, url: 'example.com/pr/441' },
  { who: 'أحمد', dir: 'rtl' as const, lang: 'ar',
    body: 'النسخة 2.4 تعمل بشكل جيد على الإصدار 11.', likes: 21, url: 'example.com/v2-4' },
];

export default function BidiCommentCard() {
  const [raw, setRaw] = useState(false);

  return (
    <div className={`grid gap-2 ${raw ? 'bcc-raw' : ''}`}>
      <div className="flex items-center justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">Thread</p>
        <label className="flex cursor-pointer items-center gap-[5px] text-[.68rem] text-text-dim">
          <input type="checkbox" checked={raw} onChange={(e) => setRaw(e.target.checked)} />
          <span>Remove isolation</span>
        </label>
      </div>

      <ul className="m-0 grid list-none gap-1.5 p-0">
        {COMMENTS.map((c) => (
          <li key={c.who} className="grid gap-1 rounded-[9px] border border-border bg-bg px-[11px] py-[9px]">
            {/* <bdi> around each independently-authored string. The handle, the
                URL and the count each have their own direction, and none may
                reorder the sentence beside it. dir on a shared parent cannot
                do this — the runs still resolve against one another. */}
            <p className="m-0 flex flex-wrap items-baseline gap-2 text-[.68rem] text-text-dim">
              <bdi className="font-medium text-text">{c.who}</bdi>
              <bdi>{c.url}</bdi>
              <bdi>{c.likes} likes</bdi>
            </p>
            {/* dir on the element CARRYING the text: the paragraph direction is
                what decides which end the trailing full stop goes to. */}
            <p dir={c.dir} lang={c.lang} className="m-0 text-[.8rem] leading-loose">
              {c.body}
            </p>
          </li>
        ))}
      </ul>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        Every handle, URL and count above is isolated from the text around it. Tick the box to see
        what happens without it — the punctuation and the numbers jump to the wrong end of the line.
      </p>
    </div>
  );
}
