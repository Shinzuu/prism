import type { APIRoute } from 'astro';
import { allComponents } from '../../lib/registry.js';

const SITE = 'https://prism.shinzuu-dev.workers.dev';

export function getStaticPaths() {
  return allComponents().map((c) => ({ params: { slug: c.slug }, props: { c } }));
}

/* One element, everything a model needs to use it without a human in the loop:
   the id to ask for, the source to paste, and the tokens it expects to exist. */
export const GET: APIRoute = ({ props }) => {
  const c = (props as { c: ReturnType<typeof allComponents>[number] }).c;
  return new Response(JSON.stringify({
    id: c.slug,
    name: c.name,
    type: c.type,
    summary: c.summary,
    stack: 'react+typescript+tailwind',
    demo: `${SITE}/components/${c.slug}`,
    preview: `${SITE}/preview/${c.slug}`,
    source: `https://github.com/Shinzuu/prism/blob/main/${c.repoPath}`,
    props: c.props,
    files: [
      { path: 'Component.tsx', language: 'tsx', contents: c.tsx },
      ...(c.usage ? [{ path: 'usage.tsx', language: 'tsx', contents: c.usage }] : []),
      ...(c.css ? [{ path: 'style.css', language: 'css', contents: c.css }] : []),
    ],
    requires: {
      peer: ['react>=19', 'tailwindcss>=4'],
      // Colours resolve through these; without them the component renders unstyled.
      tokens: ['--bg', '--surface', '--raised', '--border', '--text', '--text-dim',
               '--accent', '--accent-fg', '--sans', '--mono'],
    },
    notes: c.why || undefined,
  }, null, 2), {
    headers: { 'content-type': 'application/json; charset=utf-8', 'access-control-allow-origin': '*' },
  });
};
