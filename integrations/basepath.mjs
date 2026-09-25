// On the GitHub Pages preview the site lives under a sub-path (e.g. /sisiclinic-site/).
// Links written in content as "/first-visit/" are rewritten to include that sub-path.
// On the live site (base "/") this does nothing.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function basePathLinks(base = '/') {
  const prefix = base.replace(/\/?$/, '/');
  return {
    name: 'sisi-basepath-links',
    hooks: {
      'astro:build:done': async ({ dir, logger }) => {
        if (prefix === '/') return;
        const root = fileURLToPath(dir);
        let changed = 0;
        const walk = async (d) => {
          for (const e of await readdir(d, { withFileTypes: true })) {
            const p = join(d, e.name);
            if (e.isDirectory()) await walk(p);
            else if (e.name.endsWith('.html')) {
              const html = await readFile(p, 'utf8');
              const out = html.replace(/(href|src)="\/(?!\/)([^"]*)"/g, (m, attr, rest) => ('/' + rest).startsWith(prefix) ? m : `${attr}="${prefix}${rest}"`);
              if (out !== html) { await writeFile(p, out); changed++; }
            }
          }
        };
        await walk(root);
        logger.info(`prefixed root links with ${prefix} in ${changed} page(s)`);
      },
    },
  };
}
