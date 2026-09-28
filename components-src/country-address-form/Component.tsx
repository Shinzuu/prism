import { useState } from 'react';

type Key = 'name' | 'street' | 'city' | 'region' | 'postal';
type Fmt = {
  order: Key[];
  labels: Partial<Record<Key, string>>;
  regions?: string[];
  req: Key[];
  postalRe: RegExp;
};

/* Field ORDER, LABELS, which fields EXIST and which are REQUIRED are all
   properties of the country, not options on a fixed form. Japan writes the
   postcode first; Ireland's Eircode is optional, because most Irish addresses
   do not have one and demanding it tells the user their address is invalid. */
const FORMATS: Record<string, Fmt> = {
  US: { order: ['name', 'street', 'city', 'region', 'postal'],
        labels: { region: 'State', postal: 'ZIP code', street: 'Street address' },
        regions: ['CA', 'NY', 'TX', 'WA'], req: ['name', 'street', 'city', 'region', 'postal'],
        postalRe: /^\d{5}(-\d{4})?$/ },
  GB: { order: ['name', 'street', 'city', 'postal'],
        labels: { postal: 'Postcode', city: 'Town or city', street: 'Address' },
        req: ['name', 'street', 'city', 'postal'],
        postalRe: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i },
  JP: { order: ['postal', 'region', 'city', 'street', 'name'],
        labels: { postal: '郵便番号 Postal code', region: '都道府県 Prefecture', city: '市区町村 City', street: '番地 Street', name: '氏名 Name' },
        regions: ['東京都', '大阪府', '北海道', '福岡県'], req: ['postal', 'region', 'city', 'street', 'name'],
        postalRe: /^\d{3}-?\d{4}$/ },
  DE: { order: ['name', 'street', 'postal', 'city'],
        labels: { postal: 'PLZ', city: 'Stadt', street: 'Straße und Hausnummer', name: 'Name' },
        req: ['name', 'street', 'postal', 'city'], postalRe: /^\d{5}$/ },
  IE: { order: ['name', 'street', 'city', 'region', 'postal'],
        labels: { region: 'County', postal: 'Eircode (optional)', street: 'Address' },
        regions: ['Dublin', 'Cork', 'Galway', 'Mayo'],
        req: ['name', 'street', 'city'],            // no postcode for most addresses
        postalRe: /^[A-Z]\d{2}\s?[A-Z\d]{4}$/i },
};
const COUNTRIES = [['US', 'United States'], ['GB', 'United Kingdom'], ['JP', 'Japan'], ['DE', 'Germany'], ['IE', 'Ireland']] as const;
// Without these the browser cannot autofill an address at all.
const AUTO: Record<Key, string> = {
  name: 'name', street: 'street-address', city: 'address-level2',
  region: 'address-level1', postal: 'postal-code',
};
const CAP = (k: Key) => k[0]!.toUpperCase() + k.slice(1);

export default function CountryAddressForm() {
  const [code, setCode] = useState('US');
  // Values survive a country change: rebuilding and discarding what the user
  // typed is worse than the wrong labels.
  const [vals, setVals] = useState<Partial<Record<Key, string>>>({});
  const f = FORMATS[code]!;

  const missing = f.req.filter((k) => !(vals[k] ?? '').trim());
  const postal = (vals.postal ?? '').trim();
  const badPostal = Boolean(postal) && !f.postalRe.test(postal);

  const body = code === 'JP'
    ? [postal && `〒${postal}`, [vals.region, vals.city].filter(Boolean).join(''), vals.street, vals.name]
    : [vals.name, vals.street, [vals.city, vals.region].filter(Boolean).join(', '), postal];

  return (
    <form className="grid gap-[9px]" onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="grid gap-1">
        <label className="text-[.7rem] text-text-dim" htmlFor="caf-country">Country</label>
        <select
          id="caf-country" value={code} onChange={(e) => setCode(e.target.value)}
          className="w-full min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-[7px] font-sans text-[.8rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
        >
          {COUNTRIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="grid gap-2">
        {f.order.map((key) => {
          const req = f.req.includes(key);
          const id = `caf-${key}`;
          const label = (f.labels[key] ?? CAP(key)) + (req ? '' : ' (optional)');
          return (
            <div key={key} className="grid gap-1">
              <label className="text-[.7rem] text-text-dim" htmlFor={id}>{label}</label>
              {key === 'region' && f.regions ? (
                <select
                  id={id} name={key} required={req} autoComplete={AUTO[key]}
                  value={vals[key] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
                  className="w-full min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-[7px] font-sans text-[.8rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                >
                  <option value="" />
                  {f.regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input
                  id={id} name={key} type="text" required={req} autoComplete={AUTO[key]}
                  inputMode={key === 'postal' && ['JP', 'US', 'DE'].includes(code) ? 'numeric' : undefined}
                  value={vals[key] ?? ''} onChange={(e) => setVals((v) => ({ ...v, [key]: e.target.value }))}
                  className="w-full min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-[7px] font-sans text-[.8rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1"
                />
              )}
            </div>
          );
        })}
      </div>

      <output aria-live="polite" className="block min-h-[5.4rem] whitespace-pre-line rounded-lg border border-dashed border-border px-[10px] py-[9px] font-mono text-[.68rem] leading-relaxed text-text-dim">
        {[body.filter(Boolean).join('\n') || '—', '',
          badPostal ? `✗ ${f.labels.postal ?? 'Postal code'} does not match the format for this country`
          : missing.length ? `Still needed: ${missing.map((k) => f.labels[k] ?? CAP(k)).join(', ')}`
          : '✓ complete'].join('\n')}
      </output>
    </form>
  );
}
