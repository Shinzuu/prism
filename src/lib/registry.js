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
  /* Weeks 1-13 are the challenge itself; beyond that is the ongoing library. */
  if (!Number.isInteger(meta.week) || meta.week < 1 || meta.week > 60) {
    fail(slug, `"week" must be an integer 1-60, got ${JSON.stringify(meta.week)}`);
  }
  const read = (f) => existsSync(join(dir, f)) ? readFileSync(join(dir, f), 'utf8') : '';

  /* The library ships React + TypeScript + Tailwind. A component is published
     from Component.tsx; index.html only remains for entries still being
     migrated, and the build refuses anything that has neither. */
  const hasTsx = existsSync(join(dir, 'Component.tsx'));
  const hasHtml = existsSync(join(dir, 'index.html'));
  if (!hasTsx && !hasHtml) fail(slug, 'Component.tsx is missing.');

  const tsx = read('Component.tsx');
  const html = read('index.html');
  const css = read('style.css');
  const js = read('script.js');
  const usage = read('usage.tsx');

  /* The team standard: no hardcoded dynamic values, typed props on every
     component, and a usage example beside the preview. Each prop defaults to
     the demo value, so the gallery mounts <X /> and gets the same render. */
  let props = [];
  if (hasTsx) {
    const iface = /export interface (\w+Props)\s*\{/.exec(tsx);
    if (!iface) fail(slug, 'Component.tsx exports no "<Name>Props" interface. Every component takes typed props.');
    if (!/export default function \w+\(\s*\{/.test(tsx)) fail(slug, 'the default export takes no props. Destructure its Props with defaults.');
    if (!usage.trim()) fail(slug, 'usage.tsx is missing. Every component page shows a usage example.');
    props = parseProps(tsx, iface.index + iface[0].length);
    if (!props.length) fail(slug, `${iface[1]} declares no props.`);
  }

  /* Components must theme from tokens, never from literal colours.
     A hardcoded colour breaks the wallpaper palette and fails the library's purpose. */
  const COLOUR = /#[0-9a-fA-F]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/g;
  const notWhiteOrBlack = (v) => !/^#(fff|ffffff|000|000000)$/i.test(v);
  const literal = [...css.matchAll(COLOUR)].map(m => m[0]).filter(notWhiteOrBlack);
  if (literal.length) {
    fail(slug, `style.css uses literal colours instead of tokens: ${[...new Set(literal)].slice(0, 5).join(', ')}\n  Use var(--accent), var(--text), var(--surface) and friends.`);
  }

  /* Tailwind's arbitrary-value syntax is a hole straight through the palette
     rule — bg-[#0af] compiles fine and is exactly what this forbids. Scan the
     component source for literal colours too, including inside class strings. */
  const tsxLiteral = [...tsx.matchAll(COLOUR)].map(m => m[0]).filter(notWhiteOrBlack);
  if (tsxLiteral.length) {
    fail(slug, `Component.tsx uses literal colours instead of tokens: ${[...new Set(tsxLiteral)].slice(0, 5).join(', ')}\n  Use the Tailwind token classes (bg-accent, text-text-dim, border-border) or var(--token).`);
  }

  /* Tailwind's default palette is literal by definition, so a class naming one
     bypasses the tokens just as surely as a hex value would. */
  const PALETTE = 'slate|gray|grey|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
  const paletteClass = [...tsx.matchAll(new RegExp(`\\b(?:bg|text|border|ring|fill|stroke|from|via|to|outline|decoration|shadow|accent|caret|divide|placeholder)-(?:${PALETTE})-\\d{2,3}\\b`, 'g'))].map(m => m[0]);
  if (paletteClass.length) {
    fail(slug, `Component.tsx uses Tailwind's built-in palette: ${[...new Set(paletteClass)].slice(0, 5).join(', ')}\n  Those are literal colours. Use bg-accent, text-text-dim, border-border and friends.`);
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
    html, css, js, tsx, hasTsx, usage, props,
    repoPath: `components-src/${slug}`
  };
}

/* Reads the members of a Props interface: name, optional, type and the JSDoc
   line above each. Brace-matched rather than regexed, because a member's type
   can itself contain braces. */
function parseProps(src, start) {
  let depth = 1, i = start;
  while (i < src.length && depth) { if (src[i] === '{') depth++; else if (src[i] === '}') depth--; i++; }
  const body = src.slice(start, i - 1);
  const out = [];
  let d = 0, line = '', doc = '';
  for (let j = 0; j < body.length; j++) {
    const ch = body[j];
    if (d === 0 && body.startsWith('/**', j)) {
      const end = body.indexOf('*/', j);
      doc = body.slice(j + 3, end).replace(/^\s*\*\s?/gm, '').replace(/\s+/g, ' ').trim();
      j = end + 1; continue;
    }
    if (d === 0 && body.startsWith('//', j)) { j = body.indexOf('\n', j); if (j < 0) break; continue; }
    if ('{([<'.includes(ch)) d++;
    if ('})]>'.includes(ch) && !(ch === '>' && body[j - 1] === '=')) d--;
    if (d === 0 && ch === ';') {
      const m = /^\s*(?:readonly\s+)?(\w+)(\?)?\s*:\s*([\s\S]+?)\s*$/.exec(line);
      if (m) out.push({ name: m[1], optional: !!m[2], type: m[3].replace(/\s+/g, ' ').replace(/^\| /, ''), doc });
      line = ''; doc = '';
      continue;
    }
    line += ch;
  }
  return out;
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
