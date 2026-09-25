// Checks the built site in dist/. Usage: node scripts/check-site.mjs [--preview]
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { LEGACY_URLS, REDIRECTS_301 } from '../src/data/redirects.mjs';

const preview = process.argv.includes('--preview');
const DIST = new URL('../dist/', import.meta.url).pathname;
const base = (process.env.BASE_PATH || '/').replace(/\/?$/, '/');
const problems = [];
const bad = (m) => problems.push(m);
const warnings = [];

const htmlFiles = [];
(function walk(d) { for (const n of readdirSync(d)) { const p = join(d, n); if (statSync(p).isDirectory()) walk(p); else if (n.endsWith('.html')) htmlFiles.push(p); } })(DIST);

const pageFor = (path) => join(DIST, path ? `${path}/index.html` : 'index.html');
for (const p of LEGACY_URLS) if (!existsSync(pageFor(p))) (preview ? warnings : problems).push(`old indexed URL missing: /${p}/`);
for (const [from] of REDIRECTS_301) if (existsSync(pageFor(from))) bad(`redirect source is also a page: /${from}/`);

const exists = (urlPath) => {
  let p = decodeURI(urlPath.split('#')[0].split('?')[0]);
  if (!p.startsWith(base)) return false;
  p = p.slice(base.length);
  if (p === '' || p.endsWith('/')) return existsSync(join(DIST, p, 'index.html'));
  return existsSync(join(DIST, p));
};

for (const f of htmlFiles) {
  const rel = '/' + relative(DIST, f);
  const h = readFileSync(f, 'utf8');
  const isUtility = /\/(404|message-sent)/.test(rel);
  if ((h.match(/<h1[\s>]/g) || []).length !== 1) bad(`${rel}: needs exactly one <h1>`);
  if (!/<title>[^<]{10,}<\/title>/.test(h)) bad(`${rel}: missing <title>`);
  if (!/<meta name="description" content="[^"]{50,}"/.test(h) && !isUtility) bad(`${rel}: missing or short meta description`);
  if (!/<link rel="canonical" href="https:\/\/sisiclinic\.co\.uk\//.test(h)) bad(`${rel}: canonical must point to https://sisiclinic.co.uk/`);
  const noindex = /<meta name="robots" content="noindex/.test(h);
  if (preview && !noindex) bad(`${rel}: preview pages must be noindex`);
  if (!preview && noindex && !isUtility) bad(`${rel}: live page is noindex`);
  for (const m of h.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) bad(`${rel}: image without alt: ${m[0].slice(0, 80)}`);
  for (const m of h.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>/g)) {
    const [tag, href] = m;
    if (/treatwell\.co\.uk\/place\//.test(href) && !/widget\.treatwell\.co\.uk/.test(href)) bad(`${rel}: links to the Treatwell marketplace: ${href}`);
    if (/widget\.treatwell\.co\.uk/.test(href) && !(/target="_blank"/.test(tag) && /rel="noopener"/.test(tag))) bad(`${rel}: Treatwell link must open in a new tab`);
    if (href.startsWith('/') && !href.startsWith('//') && !exists(href)) (preview ? warnings : problems).push(`${rel}: broken link ${href}`);
  }
}
const robots = existsSync(join(DIST, 'robots.txt')) ? readFileSync(join(DIST, 'robots.txt'), 'utf8') : '';
if (preview && !/Disallow: \/\s*$/m.test(robots)) bad('preview robots.txt must disallow everything');
if (!preview && !existsSync(join(DIST, '.htaccess'))) bad('production build has no .htaccess');
if (preview && existsSync(join(DIST, '.htaccess'))) bad('preview build must not ship .htaccess');

if (warnings.length) { const uniq = [...new Set(warnings.map((w) => w.replace(/^.*broken link /, '').replace('old indexed URL missing: ', '')))]; console.warn(`Preview warning (pages not written yet): ${uniq.join(', ')}`); }
if (problems.length) { console.error(problems.join('\n')); console.error(`\n${problems.length} problem(s) in ${htmlFiles.length} pages`); process.exit(1); }
console.log(`OK: ${htmlFiles.length} pages checked (${preview ? 'preview' : 'production'})`);
