import { useCallback, useEffect, useRef, useState } from 'react';

/* A number on a dashboard claims to be true now. This card only makes that
   claim while it can back it: it shows how old the figure is, says so when the
   figure goes stale, keeps the last good value (marked as such) when a refresh
   fails, and stops calling it current once it is too old to trust.

   Ages are always computed from timestamps, never counted down. Background
   tabs throttle timers to once a minute or less, so a counter would come back
   from a hidden tab claiming an hour-old figure was twelve seconds old. */

/** Where the card stands. */
export type Freshness = 'fresh' | 'stale' | 'expired';

type Status = { kind: 'idle' } | { kind: 'loading' } | { kind: 'error'; message: string };

const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
function ago(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 5) return 'just now';
  if (s < 60) return rtf.format(-s, 'second');
  const m = Math.round(s / 60);
  if (m < 60) return rtf.format(-m, 'minute');
  const h = Math.round(m / 60);
  if (h < 48) return rtf.format(-h, 'hour');
  return rtf.format(-Math.round(h / 24), 'day');
}

/* The demo's data source: a little latency, a drifting figure, and every third
   call fails, so the error branch is visible without a broken network. */
let demoCalls = 0;
let demoValue = 1284;
const demoFetch = () => new Promise<number>((resolve, reject) => {
  demoCalls += 1;
  const fail = demoCalls % 3 === 0;
  setTimeout(() => {
    if (fail) reject(new Error('The metrics service did not answer.'));
    else resolve((demoValue += Math.round((Math.random() - 0.4) * 40)));
  }, 900);
});

export interface FreshnessCardProps {
  /** What the figure measures. */
  label?: string;
  /** The starting figure. */
  initialValue?: number;
  /** How long ago, in ms, the starting figure was measured. */
  initialAge?: number;
  /** Fetches a new figure; reject to show the error state. */
  fetchValue?: () => Promise<number>;
  /** Formats the figure; defaults to grouped digits. */
  formatValue?: (n: number) => string;
  /** Unit shown after the figure. */
  unit?: string;
  /** Age in ms after which the figure is marked stale. */
  staleAfter?: number;
  /** Age in ms after which the figure is shown only as "last known". */
  expireAfter?: number;
  /** Refresh automatically this often, in ms; 0 turns it off. Paused while the tab is hidden or offline. */
  autoRefresh?: number;
  /** Text on the refresh button. */
  refreshLabel?: string;
  /** Disables refreshing, by hand and automatically. */
  disabled?: boolean;
  /** Fired when a refresh lands, with the new figure. */
  onRefresh?: (value: number) => void;
  /** Fired when a refresh fails. */
  onError?: (error: Error) => void;
  /** Fired when the card moves between fresh, stale and expired. */
  onFreshnessChange?: (state: Freshness) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

const groupDigits = new Intl.NumberFormat('en');

export default function FreshnessCard({
  label = 'Active sessions',
  initialValue = 1284,
  initialAge = 8_000,
  fetchValue = demoFetch,
  formatValue = (n) => groupDigits.format(n),
  unit = '',
  staleAfter = 30_000,
  expireAfter = 120_000,
  autoRefresh = 0,
  refreshLabel = 'Refresh',
  disabled = false,
  onRefresh,
  onError,
  onFreshnessChange,
  className = '',
}: FreshnessCardProps) {
  const [value, setValue] = useState(initialValue);
  const [measuredAt, setMeasuredAt] = useState(() => Date.now() - initialAge);
  const [now, setNow] = useState(() => Date.now());
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [online, setOnline] = useState(() => typeof navigator === 'undefined' || navigator.onLine);
  const [visible, setVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const inFlight = useRef(false);
  const cb = useRef({ fetchValue, onRefresh, onError, onFreshnessChange });
  cb.current = { fetchValue, onRefresh, onError, onFreshnessChange };

  const age = now - measuredAt;
  const freshness: Freshness = age >= expireAfter ? 'expired' : age >= staleAfter ? 'stale' : 'fresh';

  const refresh = useCallback(async () => {
    if (inFlight.current || disabled || !online) return;
    inFlight.current = true;
    setStatus({ kind: 'loading' });
    try {
      const v = await cb.current.fetchValue();
      setValue(v);
      setMeasuredAt(Date.now());
      setNow(Date.now());
      setStatus({ kind: 'idle' });
      cb.current.onRefresh?.(v);
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      setStatus({ kind: 'error', message: err.message });
      cb.current.onError?.(err);
    } finally {
      inFlight.current = false;
    }
  }, [disabled, online]);

  // The clock only runs while someone can see it.
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [visible]);

  /* Coming back to the tab, or back online, with a stale figure refreshes at
     once rather than waiting for the next scheduled tick. */
  useEffect(() => {
    const vis = () => setVisible(!document.hidden);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    document.addEventListener('visibilitychange', vis);
    addEventListener('online', on);
    addEventListener('offline', off);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      removeEventListener('online', on);
      removeEventListener('offline', off);
    };
  }, []);
  const staleRef = useRef(freshness !== 'fresh');
  staleRef.current = freshness !== 'fresh';
  useEffect(() => {
    if (visible && online && autoRefresh > 0 && staleRef.current) void refresh();
  }, [visible, online, autoRefresh, refresh]);

  useEffect(() => {
    if (!autoRefresh || !visible || !online || disabled) return;
    const t = setInterval(() => void refresh(), autoRefresh);
    return () => clearInterval(t);
  }, [autoRefresh, visible, online, disabled, refresh]);

  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    cb.current.onFreshnessChange?.(freshness);
  }, [freshness]);

  const loading = status.kind === 'loading';
  const shown = `${formatValue(value)}${unit ? ` ${unit}` : ''}`;
  const when = new Date(measuredAt);
  const stamp = when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  // One sentence for assistive tech per change of state, not one per second.
  const announcement =
    status.kind === 'error' ? `Refresh failed. ${label} still shows the last good figure.`
    : loading ? 'Refreshing.'
    : freshness === 'expired' ? `${label} is out of date.`
    : freshness === 'stale' ? `${label} is stale.`
    : `${label} updated: ${shown}.`;

  return (
    <article
      aria-busy={loading}
      data-freshness={freshness}
      className={`fc-card grid w-full max-w-[320px] gap-[10px] rounded-[14px] border border-border bg-surface p-[18px] ${className}`}
    >
      <header className="flex items-center justify-between gap-3">
        <h3 className="m-0 text-[.84rem] font-medium text-text-dim">{label}</h3>
        {freshness !== 'fresh' && (
          <span className="rounded-full border border-border px-[8px] py-[1px] text-[.7rem] text-text-dim">
            {freshness === 'stale' ? 'stale' : 'last known'}
          </span>
        )}
      </header>

      <p className={`fc-value m-0 font-display text-[2.4rem] font-bold leading-none tabular-nums ${freshness === 'fresh' ? 'text-text' : 'text-text-dim'}`}>
        {shown}
      </p>

      {status.kind === 'error' && (
        <p role="alert" className="m-0 border-l-2 border-accent pl-[9px] text-[.78rem]">
          {status.message} This is the figure from {ago(age)}.
        </p>
      )}

      <footer className="flex items-center justify-between gap-3 text-[.76rem] text-text-dim">
        <span className="flex items-center gap-[7px]">
          <span aria-hidden="true" className={`fc-dot inline-block h-[7px] w-[7px] rounded-full ${freshness === 'fresh' && online ? 'bg-accent' : 'border border-text-dim'}`} />
          {!online ? <span>Offline, measured <time dateTime={when.toISOString()}>{ago(age)}</time></span>
            : <span>Updated <time dateTime={when.toISOString()} title={stamp}>{ago(age)}</time></span>}
        </span>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={disabled || loading || !online}
          aria-label={`${refreshLabel} ${label}`}
          className="flex cursor-pointer items-center gap-[6px] rounded-[7px] border border-border bg-bg px-[10px] py-[5px] font-sans text-[.76rem] text-text hover:border-text-dim active:translate-y-px focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className={loading ? 'fc-spin' : ''}>
            <path d="M10.2 6A4.2 4.2 0 1 1 8.8 2.9" />
            <path d="M9 1v2.4H6.6" />
          </svg>
          {loading ? 'Refreshing…' : refreshLabel}
        </button>
      </footer>

      <p className="sr-only" aria-live="polite">{announcement}</p>
    </article>
  );
}
