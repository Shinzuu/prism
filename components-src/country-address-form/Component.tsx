import { useState } from 'react';

export type AddressField = 'name' | 'street' | 'city' | 'region' | 'postal';
type Key = AddressField;
export type AddressFormat = {
  order: Key[];
  labels: Partial<Record<Key, string>>;
  regions?: string[];
  req: Key[];
  postalRe: RegExp;
  /** Postcodes are digits only, so phones get the numeric keypad. */
  numericPostal?: boolean;
  /** Preview is written largest-first (postcode, region, city, street, name). */
  largestFirst?: boolean;
  /** Mark printed before the postcode in the preview. */
  postalPrefix?: string;
};
export type AddressValues = Partial<Record<Key, string>>;

/* Field ORDER, LABELS, which fields EXIST and which are REQUIRED are all
   properties of the country, not options on a fixed form. Japan writes the
   postcode first; Ireland's Eircode is optional, because most Irish addresses
   do not have one and demanding it tells the user their address is invalid. */
const DEFAULT_FORMATS: Record<string, AddressFormat> = {
  US: { order: ['name', 'street', 'city', 'region', 'postal'],
        labels: { region: 'State', postal: 'ZIP code', street: 'Street address' },
        regions: ['CA', 'NY', 'TX', 'WA'], req: ['name', 'street', 'city', 'region', 'postal'],
        postalRe: /^\d{5}(-\d{4})?$/, numericPostal: true },
  GB: { order: ['name', 'street', 'city', 'postal'],
        labels: { postal: 'Postcode', city: 'Town or city', street: 'Address' },
        req: ['name', 'street', 'city', 'postal'],
        postalRe: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i },
  JP: { order: ['postal', 'region', 'city', 'street', 'name'],
        labels: { postal: '郵便番号 Postal code', region: '都道府県 Prefecture', city: '市区町村 City', street: '番地 Street', name: '氏名 Name' },
        regions: ['東京都', '大阪府', '北海道', '福岡県'], req: ['postal', 'region', 'city', 'street', 'name'],
        postalRe: /^\d{3}-?\d{4}$/, numericPostal: true, largestFirst: true, postalPrefix: '〒' },
  DE: { order: ['name', 'street', 'postal', 'city'],
        labels: { postal: 'PLZ', city: 'Stadt', street: 'Straße und Hausnummer', name: 'Name' },
        req: ['name', 'street', 'postal', 'city'], postalRe: /^\d{5}$/, numericPostal: true },
  IE: { order: ['name', 'street', 'city', 'region', 'postal'],
        labels: { region: 'County', postal: 'Eircode (optional)', street: 'Address' },
        regions: ['Dublin', 'Cork', 'Galway', 'Mayo'],
        req: ['name', 'street', 'city'],            // no postcode for most addresses
        postalRe: /^[A-Z]\d{2}\s?[A-Z\d]{4}$/i },
};
const DEFAULT_COUNTRIES = [['US', 'United States'], ['GB', 'United Kingdom'], ['JP', 'Japan'], ['DE', 'Germany'], ['IE', 'Ireland']] as const;
const DEFAULT_VALUES: AddressValues = {};
// Without these the browser cannot autofill an address at all.
const AUTO: Record<Key, string> = {
  name: 'name', street: 'street-address', city: 'address-level2',
  region: 'address-level1', postal: 'postal-code',
};
const CAP = (k: Key) => k[0]!.toUpperCase() + k.slice(1);

export interface CountryAddressFormProps {
  /** Address format per country code: field order, labels, regions, required fields, postcode pattern. */
  formats?: Record<string, AddressFormat>;
  /** Country picker options as [code, name] pairs; every code needs an entry in `formats`. */
  countries?: readonly (readonly [string, string])[];
  /** Country selected on first render. */
  defaultCountry?: string;
  /** Field values filled in on first render. */
  initialValues?: AddressValues;
  /** Label of the country picker. */
  countryLabel?: string;
  /** Called with the values and country code on every edit or country change. */
  onChange?: (values: AddressValues, country: string) => void;
  /** Disables the country picker and every field. */
  disabled?: boolean;
  /** Extra classes for the root form. */
  className?: string;
}

export default function CountryAddressForm({
  formats = DEFAULT_FORMATS,
  countries = DEFAULT_COUNTRIES,
  defaultCountry = 'US',
  initialValues = DEFAULT_VALUES,
  countryLabel = 'Country',
  onChange,
  disabled = false,
  className = '',
}: CountryAddressFormProps) {
  const [code, setCode] = useState(defaultCountry);
  // Values survive a country change: rebuilding and discarding what the user
  // typed is worse than the wrong labels.
  const [vals, setVals] = useState<AddressValues>(initialValues);
  const f = formats[code] ?? Object.values(formats)[0]!;

  const missing = f.req.filter((k) => !(vals[k] ?? '').trim());
  const postal = (vals.postal ?? '').trim();
  const badPostal = Boolean(postal) && !f.postalRe.test(postal);

  const body = f.largestFirst
    ? [postal && `${f.postalPrefix ?? ''}${postal}`, [vals.region, vals.city].filter(Boolean).join(''), vals.street, vals.name]
    : [vals.name, vals.street, [vals.city, vals.region].filter(Boolean).join(', '), postal];

  const pickCountry = (next: string) => {
    setCode(next);
    onChange?.(vals, next);
  };
  const edit = (key: Key, value: string) => {
    const next = { ...vals, [key]: value };
    setVals(next);
    onChange?.(next, code);
  };

  const fieldClass = 'w-full min-w-0 rounded-[7px] border border-border bg-bg px-[9px] py-[7px] font-sans text-[.8rem] text-text focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-1 enabled:hover:border-text-dim disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <form className={`grid gap-[9px] ${className}`} onSubmit={(e) => e.preventDefault()} noValidate>
      <div className="grid gap-1">
        <label className="text-[.7rem] text-text-dim" htmlFor="caf-country">{countryLabel}</label>
        <select
          id="caf-country" value={code} onChange={(e) => pickCountry(e.target.value)} disabled={disabled}
          className={fieldClass}
        >
          {countries.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
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
                  id={id} name={key} required={req} autoComplete={AUTO[key]} disabled={disabled}
                  value={vals[key] ?? ''} onChange={(e) => edit(key, e.target.value)}
                  className={fieldClass}
                >
                  <option value="" />
                  {f.regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              ) : (
                <input
                  id={id} name={key} type="text" required={req} autoComplete={AUTO[key]} disabled={disabled}
                  inputMode={key === 'postal' && f.numericPostal ? 'numeric' : undefined}
                  value={vals[key] ?? ''} onChange={(e) => edit(key, e.target.value)}
                  className={fieldClass}
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
