// @ts-check
import { defineConfig } from 'astro/config';

export default defineConfig({
  // Emit /components/<slug>.html so the live URL has no trailing slash.
  // Submission links must resolve with a direct 200, not a redirect.
  build: { format: 'file' },
  trailingSlash: 'never'
});
