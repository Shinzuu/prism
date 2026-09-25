import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* Resolve from the project root, not from import.meta.url: Vite bundles this module
   and the bundle does not live in the source tree. */
const SRC = join(process.cwd(), 'components-src');

/* The challenge voids any submission posted without its prompt.
   So a component without a final prompt must not be publishable at all. */
const TYPES = ['button','form','card','modal','navbar','table','loader','section','chart','input'];

function fail(slug, msg) {
  throw new Error(`\n\n  prism: component "${slug}" cannot be published.\n  ${msg}\n`);
}

function loadOne(slug) {
  const dir = join(SRC, slug);
  const metaPath = join(dir, 'meta.json');

  if (!existsSync(metaPath)) fail(slug, 'meta.json is missing.');

  let meta;
  try { meta = JSON.parse(readFileSync(metaPath, 'utf8')); }
  catch (e) { fail(slug, `meta.json is not valid JSON: ${e.message}`); }

  const finalPrompt = (meta.finalPrompt || '').trim();
  if (!finalPrompt) {
    fail(slug, 'meta.json has no "finalPrompt". A submission without its prompt is not counted, so this cannot ship.');
  }
  if (finalPrompt.length < 40) {
    fail(slug, `"finalPrompt" is ${finalPrompt.length} chars. That is too short to be the real prompt.`);
  }
  if (!meta.name) fail(slug, 'meta.json has no "name".');
  if (!TYPES.includes(meta.type)) {
    fail(slug, `"type" is ${JSON.stringify(meta.type)}. Must be one of: ${TYPES.join(', ')}`);
  }
  if (!Number.isInteger(meta.week) || meta.week < 1 || meta.week > 13) {
    fail(slug, `"week" must be an integer 1-13, got ${JSON.stringify(meta.week)}`);
  }
  if (!existsSync(join(dir, 'index.html'))) fail(slug, 'index.html is missing.');

  const read = (f) => existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '';
  const html = read('index.html');
  const css = read('style.css');
  const js = read('script.js');

  /* Components must theme from tokens, never from literal colours.
     A hardcoded colour breaks the wallpaper palette and fails the library's purpose. */
  const literal = [...css.matchAll(/#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g)]
    .map(m => m[0])
    .filter(v => !/^#(fff|ffffff|000|000000)$/i.test(v));
  if (literal.length) {
    fail(slug, `style.css uses literal colours instead of tokens: ${[...new Set(literal)].slice(0, 5).join(', ')}\n  Use var(--accent), var(--text), var(--surface) and friends.`);
  }

  return {
    slug,
    name: meta.name,
    type: meta.type,
    week: meta.week,
    date: meta.date || '',
    summary: meta.summary || '',
    finalPrompt,
    attempts: Array.isArray(meta.attempts) ? meta.attempts : [],
    why: meta.why || '',
    html, css, js,
    repoPath: `components-src/${slug}`
  };
}

export function allComponents() {
  /* Never fail quietly here. An empty gallery that builds green is worse than a red build. */
  if (!existsSync(SRC)) {
    throw new Error(`\n\n  prism: components-src not found at ${SRC}\n  The build must run from the project root.\n`);
  }
  const slugs = readdirSync(SRC)
    .filter(d => !d.startsWith('_'))
    .filter(d => statSync(join(SRC, d)).isDirectory());

  const seen = new Map();
  const out = slugs.map(loadOne);

  for (const c of out) {
    if (seen.has(c.name.toLowerCase())) fail(c.slug, `duplicate component name "${c.name}".`);
    seen.set(c.name.toLowerCase(), c.slug);
  }
  if (!out.length) {
    throw new Error('\n\n  prism: components-src is empty. The gallery cannot build with zero components.\n');
  }
  return out.sort((a, b) => a.week - b.week || a.name.localeCompare(b.name));
}

export const COMPONENT_TYPES = TYPES;

/* The scheduled remainder of the ninety days. Kept beside the built components
   so the library shows the whole slate and the types stay balanced. */
export function plannedComponents() {
  const f = join(SRC, '_planned.json');
  if (!existsSync(f)) return [];
  const { components } = JSON.parse(readFileSync(f, 'utf8'));
  return components.map((c) => {
    if (!TYPES.includes(c.type)) {
      throw new Error(`\n\n  prism: planned component "${c.name}" has type "${c.type}", which is not permitted.\n`);
    }
    return { ...c, planned: true, slug: c.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') };
  });
}
