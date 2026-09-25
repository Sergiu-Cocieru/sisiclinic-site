// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import { htaccess } from './integrations/htaccess.mjs';
import { basePathLinks } from './integrations/basepath.mjs';

// PREVIEW=1 builds the public preview (GitHub Pages): noindex everywhere, no .htaccess.
// Without it we build the production site for sisiclinic.co.uk (GoDaddy).
const PREVIEW = process.env.PREVIEW === '1';
const SITE = process.env.SITE_URL || 'https://sisiclinic.co.uk';
const BASE = process.env.BASE_PATH || '/';

export default defineConfig({
  site: SITE,
  base: BASE,
  trailingSlash: 'always',
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  integrations: [
    sitemap({ filter: (page) => !/\/(404|message-sent)\/$/.test(page) }),
    htaccess({ enabled: !PREVIEW }),
    basePathLinks(BASE),
  ],
  vite: {
    // lightningcss folds animation-timeline into the animation shorthand, which browsers then drop
    build: { cssMinify: 'esbuild' },
    define: {
      'import.meta.env.PUBLIC_PREVIEW': JSON.stringify(PREVIEW ? '1' : ''),
    },
  },
});
