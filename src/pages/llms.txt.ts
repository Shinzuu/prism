import type { APIRoute } from 'astro';
import { allComponents } from '../lib/registry.js';

const SITE = 'https://prism.shinzuu-dev.workers.dev';

/* llms.txt: the plain-text convention models look for. Same contract as
   elements.json, in the form a model can read without parsing anything. */
export const GET: APIRoute = () => {
  const all = allComponents();
  const lines = [
    '# prism',
    '',
    '> React + TypeScript + Tailwind elements, addressable by id.',
    '',
    'To use one, reference it by id — "use the slide-confirm element" — then fetch',
    `its record at ${SITE}/elements/<id>.json for the source.`,
    '',
    `Index: ${SITE}/elements.json`,
    '',
    '## Elements',
    '',
    ...all.map((c) => `- [${c.slug}](${SITE}/elements/${c.slug}.json): ${c.type} — ${c.summary}`),
    '',
  ];
  return new Response(lines.join('\n'), {
    headers: { 'content-type': 'text/plain; charset=utf-8', 'access-control-allow-origin': '*' },
  });
};
