import CountryAddressForm, { type AddressFormat, type AddressValues } from './Component';

// Use it at checkout when the shipping country decides which address fields exist and in what order.
const formats: Record<string, AddressFormat> = {
  CA: { order: ['name', 'street', 'city', 'region', 'postal'],
        labels: { region: 'Province', postal: 'Postal code', street: 'Street address' },
        regions: ['AB', 'BC', 'ON', 'QC'], req: ['name', 'street', 'city', 'region', 'postal'],
        postalRe: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i },
  NL: { order: ['name', 'street', 'postal', 'city'],
        labels: { postal: 'Postcode', city: 'Plaats', street: 'Straat en huisnummer' },
        req: ['name', 'street', 'postal', 'city'], postalRe: /^\d{4}\s?[A-Z]{2}$/i },
};

export default function Example() {
  return (
    <CountryAddressForm
      formats={formats}
      countries={[['CA', 'Canada'], ['NL', 'Netherlands']]}
      defaultCountry="CA"
      countryLabel="Ship to"
      onChange={(values: AddressValues, country) => console.log(country, values)}
    />
  );
}
