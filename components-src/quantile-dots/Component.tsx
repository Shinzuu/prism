import { useMemo, useState } from 'react';

const N = 100;   // one dot per percentile: the natural frequency is the point
const MEAN = 42, SD = 11;

/* Acklam's inverse normal CDF. Evenly spaced QUANTILES, not random samples —
   random dots make the reader judge a different picture on every load. */
function probit(p: number) {
  const a = [-3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2, 1.383577518672690e2, -3.066479806614716e1, 2.506628277459239];
  const b = [-5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2, 6.680131188771972e1, -1.328068155288572e1];
  const c = [-7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838, -2.549732539343734, 4.374664141464968, 2.938163982698783];
  const d = [7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996, 3.754408661907416];
  const pl = 0.02425;
  if (p < pl) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
           ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  if (p > 1 - pl) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c[0]! * q + c[1]!) * q + c[2]!) * q + c[3]!) * q + c[4]!) * q + c[5]!) /
            ((((d[0]! * q + d[1]!) * q + d[2]!) * q + d[3]!) * q + 1);
  }
  const q = p - 0.5, r = q * q;
  return (((((a[0]! * r + a[1]!) * r + a[2]!) * r + a[3]!) * r + a[4]!) * r + a[5]!) * q /
         (((((b[0]! * r + b[1]!) * r + b[2]!) * r + b[3]!) * r + b[4]!) * r + 1);
}

export interface QuantileDotsProps {
  /** Number of dots; one per quantile, so 100 reads as "times in 100". */
  count?: number;
  /** Mean of the normal distribution the quantiles are drawn from. */
  mean?: number;
  /** Standard deviation of that distribution. */
  sd?: number;
  /** Real outcomes to plot instead of normal quantiles; overrides count, mean and sd. */
  values?: number[];
  /** Threshold the slider starts at. */
  initialThreshold?: number;
  /** Lowest threshold the slider allows. */
  min?: number;
  /** Highest threshold the slider allows. */
  max?: number;
  /** Heading above the plot. */
  title?: string;
  /** Noun used in the accessible description, e.g. "delivery" in "100 delivery outcomes". */
  subject?: string;
  /** Unit appended to values and the threshold. */
  unit?: string;
  /** Verb in the status line, e.g. "arrive" in "62 of 100 arrive within 48 days". */
  outcomeVerb?: string;
  /** Label before the slider. */
  thresholdLabel?: string;
  /** Disables the threshold slider. */
  disabled?: boolean;
  /** Fired when the threshold changes, with the new threshold and how many dots fall under it. */
  onThresholdChange?: (threshold: number, under: number) => void;
  /** Extra classes appended to the root element. */
  className?: string;
}

export default function QuantileDots({
  count = N,
  mean = MEAN,
  sd = SD,
  values: data,
  initialThreshold = 48,
  min = 20,
  max = 65,
  title = 'Delivery time',
  subject = 'delivery',
  unit = 'days',
  outcomeVerb = 'arrive',
  thresholdLabel = 'Within',
  disabled = false,
  onThresholdChange,
  className = '',
}: QuantileDotsProps) {
  const [threshold, setThreshold] = useState(initialThreshold);

  const values = useMemo(
    () => (data ? [...data] : Array.from({ length: count }, (_, i) => mean + sd * probit((i + 0.5) / count))).sort((a, b) => a - b),
    [data, count, mean, sd]
  );
  const n = values.length;
  const under = values.filter((v) => v <= threshold).length;

  return (
    <div className={`grid gap-[10px] ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          {title} <span className="font-normal text-text-dim">— {n} outcomes</span>
        </p>
        <p className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">
          {under} of {n} {outcomeVerb} within {threshold} {unit}
        </p>
      </div>

      {/* One dot per outcome. A density curve asks the reader to integrate;
          counting dots is something people do correctly without being taught. */}
      <div className="grid grid-cols-[repeat(20,1fr)] gap-[3px] rounded-lg border border-border bg-bg p-2"
           role="img" aria-label={`Dot plot of ${n} ${subject} outcomes. ${under} ${outcomeVerb} within ${threshold} ${unit}.`}>
        {values.map((v, i) => (
          <span key={i}
            title={`${v.toFixed(1)} ${unit}`}
            className={`aspect-square rounded-full ${v <= threshold ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--border)_70%,transparent)]'}`} />
        ))}
      </div>

      <label className="flex items-center gap-2 text-[.72rem] text-text-dim">
        {thresholdLabel}
        <input type="range" min={min} max={max} value={threshold} disabled={disabled}
               onChange={(e) => {
                 const t = Number(e.target.value);
                 setThreshold(t);
                 onThresholdChange?.(t, values.filter((v) => v <= t).length);
               }}
               className="min-w-0 flex-1 accent-accent focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50" />
        <output className="w-14 text-right font-mono text-[.68rem] tabular-nums text-text">{threshold} {unit}</output>
      </label>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        A natural-frequency reading: “{under} times in {n}”, not a shaded tail anyone has to integrate
        by eye.
      </p>
    </div>
  );
}
