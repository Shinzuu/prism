// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  // Emit /components/<slug>.html so the live URL has no trailing slash.
  // Submission links must resolve with a direct 200, not a redirect.
  build: { format: 'file' },
  trailingSlash: 'never',
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
