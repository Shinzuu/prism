# Country Address Form

- **Element ID:** `country-address-form`
- **Type:** form
- **Live:** https://prism.shinzuu-dev.workers.dev/components/country-address-form
- **Record (JSON for LLMs):** https://prism.shinzuu-dev.workers.dev/elements/country-address-form.json

Switch the country and the form rebuilds — fields reorder, labels rewrite, the state select disappears for the UK, Japan puts the postcode first, and Ireland stops demanding a postcode it does not have.

## Final prompt

```
Build an address form that rebuilds itself per country, in plain HTML, CSS and vanilla JavaScript.

For each of US, GB, JP, DE and IE, define four things — and treat all four as properties of the country, not options on a fixed form:
1. The field ORDER, in that country's postal sequence. Japan is postcode, prefecture, city, street, name: the reverse of the US. Germany puts the postcode before the city on the same line.
2. The LABELS, in that country's own terms — State/ZIP for the US, County/Eircode for Ireland, 郵便番号/都道府県 for Japan.
3. Which fields EXIST. The UK has no state or county select in a postal address.
4. Which fields are REQUIRED. Ireland's Eircode is optional, because most Irish addresses do not have one — demanding it tells the user their real address is invalid.

Apply the postal-code pattern for the selected country only, and never apply one country's pattern to another's input.

Preserve what the user has already typed across a country change. Rebuilding the form and silently discarding their input is worse than the wrong labels.

Set the correct autocomplete token on every field (name, street-address, address-level2 for city, address-level1 for region, postal-code). Without them the browser cannot autofill an address at all, which is the single biggest usability win available here. Set inputmode="numeric" on purely numeric postcodes only — the UK and Ireland have letters.

Render a live preview of the formatted address in the country's own line order inside an aria-live region, and say specifically what is still needed rather than marking fields red.

Use tokens only: var(--bg), var(--raised), var(--text), var(--text-dim), var(--border), var(--accent), var(--mono). No literal colours. Collapse to one column under about 420px.
```

## What failed first

### Attempt 1

> Build an address form with country, street, city, state and ZIP.

One fixed form with American labels. Someone in Dublin is asked for a State and a ZIP code, neither of which exists for them, and the form refuses to submit until they invent one. The form is not validating the address — it is asserting that every address is American.

### Attempt 2

> Hide the state field for countries that do not use one, and rename ZIP to postcode.

Better labels, same structure. The field ORDER is part of an address format: Japan writes the postcode first, then prefecture, then city, then street, then name — the reverse of the US order. Keeping the American sequence and translating the labels produces a form that reads backwards to the person filling it in, and postal validation was still applied to Ireland, where most addresses have no Eircode at all.

## Why this one is worth keeping

The mistake this component exists to correct is not a missing translation, it is a structural assumption: that an address is a fixed set of fields and a country is one of them. Field order, field existence and field requiredness are all properties of the country, and getting the labels right while keeping the American sequence produces a form that reads backwards to a Japanese user. The requiredness point is the sharpest: demanding an Eircode from an Irish address, or a State from a British one, is the form telling a person that where they live is invalid. The unglamorous detail that matters most in practice is the autocomplete tokens — without them the browser cannot fill any of this in, and that single attribute set saves more time than the rest of the component.
