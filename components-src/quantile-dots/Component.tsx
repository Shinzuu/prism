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

export default function QuantileDots() {
  const [threshold, setThreshold] = useState(48);

  const values = useMemo(
    () => Array.from({ length: N }, (_, i) => MEAN + SD * probit((i + 0.5) / N)).sort((a, b) => a - b),
    []
  );
  const under = values.filter((v) => v <= threshold).length;

  return (
    <div className="grid gap-[10px]">
      <div className="flex flex-wrap items-baseline justify-between gap-[10px]">
        <p className="m-0 text-[.82rem] font-medium">
          Delivery time <span className="font-normal text-text-dim">— 100 outcomes</span>
        </p>
        <p className="m-0 font-mono text-[.68rem] tabular-nums text-text-dim">
          {under} of {N} arrive within {threshold} days
        </p>
      </div>

      {/* One dot per outcome. A density curve asks the reader to integrate;
          counting dots is something people do correctly without being taught. */}
      <div className="grid grid-cols-[repeat(20,1fr)] gap-[3px] rounded-lg border border-border bg-bg p-2"
           role="img" aria-label={`Dot plot of 100 delivery outcomes. ${under} arrive within ${threshold} days.`}>
        {values.map((v, i) => (
          <span key={i}
            title={`${v.toFixed(1)} days`}
            className={`aspect-square rounded-full ${v <= threshold ? 'bg-accent' : 'bg-[color-mix(in_oklab,var(--border)_70%,transparent)]'}`} />
        ))}
      </div>

      <label className="flex items-center gap-2 text-[.72rem] text-text-dim">
        Within
        <input type="range" min={20} max={65} value={threshold}
               onChange={(e) => setThreshold(Number(e.target.value))}
               className="min-w-0 flex-1 accent-accent" />
        <output className="w-14 text-right font-mono text-[.68rem] tabular-nums text-text">{threshold} days</output>
      </label>

      <p className="m-0 text-[.72rem] leading-relaxed text-text-dim">
        A natural-frequency reading: “{under} times in 100”, not a shaded tail anyone has to integrate
        by eye.
      </p>
    </div>
  );
}
