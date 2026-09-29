import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

/* Same reasoning as the component registry: resolve from the project root,
   because this module is bundled and the bundle does not sit in the tree. */
const DIR = join(process.cwd(), 'agent-logs');

/* The logs are written as plain text so they can be read in the repo without a
   site, and posted to Discord by copy and paste. The page parses that text
   rather than asking the author to maintain a second, structured copy. */
const KEYS = [
  ['Week:', 'week'],
  ['Task:', 'task'],
  ['Agent:', 'agent'],
  ['Prompt or workflow:', 'prompt'],
  ['Result:', 'result'],
  ['What it saved:', 'saved'],
];

function parse(file, text) {
  const out = { file, week: '', task: '', agent: '', prompt: '', result: '', saved: '' };
  let key = null;
  const buf = [];

  const flush = () => {
    if (key) out[key] = buf.join('\n').trim();
    buf.length = 0;
  };

  for (const line of text.split('\n')) {
    /* A header only counts at the start of a line and only for the six known
       labels. Body prose is full of sentences that end in a colon. */
    const hit = KEYS.find(([label]) => line.startsWith(label));
    if (hit) {
      flush();
      key = hit[1];
      buf.push(line.slice(hit[0].length).trim());
    } else if (key) {
      buf.push(line);
    }
  }
  flush();

  if (!out.week) throw new Error(`\n\n  prism: ${file} has no "Week:" line.\n`);
  if (!out.task) throw new Error(`\n\n  prism: ${file} has no "Task:" line.\n`);
  /* A log without its prompt is the same void as a component without its prompt. */
  if (!out.prompt) throw new Error(`\n\n  prism: ${file} has no "Prompt or workflow:" section.\n`);
  /* The submission format asks for Result — what it produced, what it saved.
     Three of these logs opened the section as a sentence ("Result, over the
     following weeks:") rather than as the field, which reads fine and is not
     the template. Only a field at the start of a line counts. */
  if (!out.result) throw new Error(`\n\n  prism: ${file} has no "Result:" section. The submission format requires one.\n`);

  out.n = Number.parseInt(out.week, 10);
  out.slug = `week-${out.week}`;
  out.raw = text;
  return out;
}

export function allLogs() {
  if (!existsSync(DIR)) {
    throw new Error(`\n\n  prism: agent-logs not found at ${DIR}\n  The build must run from the project root.\n`);
  }
  const files = readdirSync(DIR).filter((f) => f.endsWith('.txt')).sort();
  if (!files.length) throw new Error('\n\n  prism: agent-logs is empty.\n');
  return files
    .map((f) => parse(f, readFileSync(join(DIR, f), 'utf8')))
    .sort((a, b) => a.n - b.n);
}
