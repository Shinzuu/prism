import { useEffect, useRef, useState } from 'react';

const HOLD = 220;     // ms before the wheel opens
const RADIUS = 92;
const DEAD = 26;      // inside this, releasing cancels

/** One wheel option. Disabled options can be seen but never armed or fired. */
export type RadialItem = { label: string; disabled?: boolean };

const DEFAULT_ITEMS: RadialItem[] = ['Duplicate', 'Move', 'Export', 'Rename', 'Archive', 'Delete'].map((label) => ({ label }));

export interface RadialMenuProps {
  /** Options around the wheel, placed clockwise from twelve o'clock. */
  items?: RadialItem[];
  /** Label of the button you press and hold. */
  triggerLabel?: string;
  /** Accessible name of the menu. */
  menuLabel?: string;
  /** Status text when the gesture is released in the dead zone or escaped. */
  cancelledText?: string;
  /** How long the press must be held before the wheel opens, in ms. */
  holdMs?: number;
  /** Distance from the pointer to each option when open, in px. */
  radius?: number;
  /** Radius around the press point where releasing cancels, in px. */
  deadZone?: number;
  /** Disables the trigger so the wheel cannot be opened. */
  disabled?: boolean;
  /** Fired when an option is chosen, by gesture, click or keyboard. */
  onSelect?: (item: RadialItem, index: number) => void;
  /** Fired when the gesture is released without choosing. */
  onCancel?: () => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

/* Press and hold opens a wheel under the pointer; release on one fires it. The
   distance your hand travels is the same for every option, which is the entire
   argument for a radial menu over a list. */
export default function RadialMenu({
  items = DEFAULT_ITEMS,
  triggerLabel = 'Press and hold',
  menuLabel = 'Actions',
  cancelledText = 'Cancelled',
  holdMs = HOLD,
  radius: openRadius = RADIUS,
  deadZone = DEAD,
  disabled = false,
  onSelect,
  onCancel,
  className = '',
}: RadialMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [armed, setArmed] = useState<number | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [out, setOut] = useState('');
  const [resting, setResting] = useState(true);

  /* Furled preview: the wheel sits small and dim until first use. A radial
     control that looks empty in a screenshot reads as broken. */
  useEffect(() => {
    const anchor = anchorRef.current, root = rootRef.current;
    if (!anchor || !root) return;
    const rest = () => {
      const b = anchor.getBoundingClientRect(), r = root.getBoundingClientRect();
      setPos({ x: b.left - r.left + b.width / 2, y: b.top - r.top - 56 });
    };
    rest();
    addEventListener('resize', rest);
    return () => removeEventListener('resize', rest);
  }, []);

  const show = (x: number, y: number) => {
    const r = rootRef.current!.getBoundingClientRect();
    setResting(false);
    setPos({ x: x - r.left, y: y - r.top });
    origin.current = { x, y };
    setOpen(true);
  };

  const hide = () => { setOpen(false); setArmed(null); origin.current = null; };

  const aim = (x: number, y: number) => {
    if (!origin.current) return;
    const dx = x - origin.current.x, dy = y - origin.current.y;
    if (Math.hypot(dx, dy) < deadZone) { setArmed(null); return; }   // dead zone
    let ang = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
    if (ang < 0) ang += 360;
    const i = Math.round(ang / (360 / items.length)) % items.length;
    setArmed(items[i]?.disabled ? null : i);
  };

  const fire = (i: number | null) => {
    const item = i === null ? undefined : items[i];
    if (i === null || !item) { setOut(cancelledText); onCancel?.(); return; }
    if (item.disabled) return;
    setOut(`${item.label} selected`);
    onSelect?.(item, i);
  };

  // Next enabled option from i in direction dir, or i itself if none is enabled.
  const step = (i: number, dir: 1 | -1) => {
    const n = items.length;
    for (let k = 1; k <= n; k++) {
      const j = (((i + dir * k) % n) + n) % n;
      if (!items[j]?.disabled) return j;
    }
    return i;
  };

  const radius = open ? openRadius : resting ? 46 : 0;

  return (
    <div ref={rootRef} data-open={open} className={`rm relative grid min-h-[250px] justify-items-start gap-[10px] pt-[108px] ${className}`}>
      <button
        ref={anchorRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onPointerDown={(e) => {
          if (disabled) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          const { clientX, clientY } = e;
          timer.current = setTimeout(() => show(clientX, clientY), holdMs);
        }}
        onPointerMove={(e) => { if (open) aim(e.clientX, e.clientY); }}
        onPointerUp={() => {
          if (timer.current) clearTimeout(timer.current);
          if (!open) return;
          fire(armed);
          hide();
        }}
        onPointerCancel={() => { if (timer.current) clearTimeout(timer.current); if (open) hide(); }}
        onKeyDown={(e) => {
          // Keyboard is not a translation of the gesture: it gets its own path.
          if (disabled || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          const b = e.currentTarget.getBoundingClientRect();
          show(b.left + b.width / 2, b.bottom + 8);
          const first = items[0]?.disabled ? step(0, 1) : 0;
          setArmed(first);
          setTimeout(() => itemRefs.current[first]?.focus(), 0);
        }}
        className={`cursor-pointer touch-none rounded-full border px-[18px] py-2.5 font-sans text-[.9rem] ${
          open ? 'border-accent bg-accent text-accent-fg' : 'border-border bg-surface text-text hover:border-accent'
        } focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-[3px] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border`}
      >
        {triggerLabel}
      </button>

      <div
        role="menu"
        aria-label={menuLabel}
        data-rest={resting || undefined}
        style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
        onKeyDown={(e) => {
          const i = itemRefs.current.findIndex((el) => el === document.activeElement);
          if (i < 0) return;
          let to: number | null = null;
          if (e.key === 'ArrowRight' || e.key === 'ArrowDown') to = step(i, 1);
          else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') to = step(i, -1);
          else if (e.key === 'Escape') { e.preventDefault(); hide(); anchorRef.current?.focus(); return; }
          else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (items[i]?.disabled) return; fire(i); hide(); anchorRef.current?.focus(); return; }
          if (to === null) return;
          e.preventDefault();
          setArmed(to);
          itemRefs.current[to]?.focus();
        }}
        className={`rm-wheel absolute z-10 h-0 w-0 ${resting ? 'opacity-40' : ''}`}
      >
        {items.map(({ label, disabled: off }, i) => (
          <button
            key={label}
            role="menuitem"
            type="button"
            ref={(el) => { itemRefs.current[i] = el; }}
            aria-disabled={off || undefined}
            data-armed={armed === i || undefined}
            // Twelve o'clock, clockwise, so the order is readable.
            style={{ '--a': `${(i / items.length) * 360 - 90}deg`, '--r': `${radius}px` } as React.CSSProperties}
            onClick={() => { if (off) return; fire(i); hide(); anchorRef.current?.focus(); }}
            className="rm-item absolute whitespace-nowrap rounded-full border border-border bg-bg px-[13px] py-[7px] font-sans text-[.8rem] text-text hover:border-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 aria-disabled:cursor-not-allowed aria-disabled:border-dashed aria-disabled:text-text-dim aria-disabled:hover:border-border"
          >
            {label}
          </button>
        ))}
        <span aria-hidden className="absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-accent" />
      </div>

      <p role="status" aria-live="polite" className="m-0 min-h-[1.2em] text-[.82rem] text-text-dim">{out}</p>
    </div>
  );
}
