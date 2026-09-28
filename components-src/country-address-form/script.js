/* An address form is not one form with optional fields. The field set, their
   order, their labels and their validity differ per country — and a form that
   says "State" and "ZIP" to someone in Dublin is telling them their address is
   wrong when it is the form that is wrong. */
(() => {
  /* order is the postal order for that country. `req` marks what is actually
     required THERE: Ireland has no postcode for most addresses, Japan writes
     the postcode first and the prefecture before the city. */
  const FORMATS = {
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
          req: ['name', 'street', 'city'],     // no postcode for most addresses
          postalRe: /^[A-Z]\d{2}\s?[A-Z\d]{4}$/i },
  };

  document.querySelectorAll('[data-caf]').forEach((form) => {
    const sel = form.querySelector('[data-caf-country]');
    const host = form.querySelector('[data-caf-fields]');
    const out = form.querySelector('[data-caf-out]');
    const kept = {};   // values survive a country change

    const build = () => {
      const code = sel.value;
      const f = FORMATS[code];
      // Preserve what the user typed before the layout changes under them.
      for (const el of host.querySelectorAll('[name]')) kept[el.name] = el.value;

      host.replaceChildren();
      const pairRow = (code === 'DE' || code === 'US') ? null : null;

      for (const key of f.order) {
        const wrap = document.createElement('div');
        wrap.className = 'caf__field';
        const id = 'caf-' + key;
        const label = document.createElement('label');
        label.className = 'caf__lab';
        label.htmlFor = id;
        const req = f.req.includes(key);
        label.textContent = (f.labels[key] || key[0].toUpperCase() + key.slice(1)) + (req ? '' : ' (optional)');

        let field;
        if (key === 'region' && f.regions) {
          field = document.createElement('select');
          field.className = 'caf__sel';
          field.append(new Option('', ''));
          for (const r of f.regions) field.append(new Option(r, r));
        } else {
          field = document.createElement('input');
          field.className = 'caf__in';
          field.type = 'text';
          // Autofill only works if the browser is told what each field is.
          field.autocomplete = { name: 'name', street: 'street-address', city: 'address-level2',
            region: 'address-level1', postal: 'postal-code' }[key];
          if (key === 'postal') field.inputMode = code === 'JP' || code === 'US' || code === 'DE' ? 'numeric' : 'text';
        }
        field.id = id; field.name = key;
        if (req) field.required = true;
        if (kept[key]) field.value = kept[key];
        field.addEventListener('input', render);
        field.addEventListener('change', render);

        wrap.append(label, field);
        host.append(wrap);
      }
      render();
    };

    const render = () => {
      const code = sel.value, f = FORMATS[code];
      const v = {};
      for (const el of host.querySelectorAll('[name]')) v[el.name] = el.value.trim();

      const missing = f.req.filter((k) => !v[k]);
      const badPostal = v.postal && f.postalRe && !f.postalRe.test(v.postal);

      const lines = f.order.filter((k) => k !== 'name' && v[k]);
      const body = code === 'JP'
        ? [v.postal && '〒' + v.postal, [v.region, v.city].filter(Boolean).join(''), v.street, v.name]
        : [v.name, v.street, [v.city, v.region].filter(Boolean).join(', '), v.postal];

      out.textContent = [
        body.filter(Boolean).join('\n') || '—',
        '',
        badPostal ? '✗ ' + (f.labels.postal || 'Postal code') + ' does not match the format for this country'
          : missing.length ? 'Still needed: ' + missing.map((k) => (f.labels[k] || k)).join(', ')
          : '✓ complete',
      ].join('\n');
    };

    sel.addEventListener('change', build);
    form.addEventListener('submit', (e) => e.preventDefault());
    build();
  });
})();
