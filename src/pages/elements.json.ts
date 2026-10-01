import type { APIRoute } from 'astro';
import { allComponents, COMPONENT_TYPES } from '../lib/registry.js';

const SITE = 'https://prism.shinzuu-dev.workers.dev';

/* The index a model reads first: every element id, what it is, and where the
   full record lives. Ask for an element by id, fetch its record, paste it in. */
export const GET: APIRoute = () => {
  const all = allComponents();
  return new Response(JSON.stringify({
    name: 'prism',
    description: 'React + TypeScript + Tailwind elements, addressable by id.',
    stack: 'react+typescript+tailwind',
    usage: 'Reference an element by its id, for example: use the "slide-confirm" element. Fetch /elements/<id>.json for its source.',
    types: COMPONENT_TYPES,
    count: all.length,
    elements: all.map((c) => ({
      id: c.slug,
      name: c.name,
      type: c.type,
      summary: c.summary,
      record: `${SITE}/elements/${c.slug}.json`,
      demo: `${SITE}/components/${c.slug}`,
    })),
  }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
};
