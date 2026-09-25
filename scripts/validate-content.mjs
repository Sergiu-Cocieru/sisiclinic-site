// Quick content checker that runs without Astro (safe to run while others edit).
// Usage: node scripts/validate-content.mjs [file ...]   (no args = all content)
// Checks: front matter parses, required fields present, known enums, image files exist,
// Treatwell IDs look right, and no advertising claims the ASA/CAP code rules out.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, relative, basename } from 'node:path';
import yaml from 'js-yaml';

const ROOT = new URL('..', import.meta.url).pathname;
const C = join(ROOT, 'src/content');
const errors = [];
const err = (f, m) => errors.push(`${relative(ROOT, f)}: ${m}`);

const BANNED = [
  /\bpain[- ]?free\b/i, /\bpainless\b/i, /\bno pain\b/i, /does not (cause|hurt)/i, /doesn'?t hurt/i,
  /\bpermanent(ly)?\b/i, /100% natural/i, /\b0% (risk|burn)/i, /zero risk/i, /no risk/i, /\bno ingrown/i,
  /\bhypoallergenic\b/i, /non[- ]comedogenic/i, /\bguarantee(d)?\b/i, /\bexclusively\b/i, /first and only/i,
  /only (studio|clinic) in/i, /\bsafe for everyone\b/i, /\bcompletely safe\b/i, /\b100% safe\b/i, /(?<!not )\bIPL\b/,
  /treatwell\.co\.uk\/place/i,
];
const IMG_DIR = join(ROOT, 'src/assets/uploads');
const imgOk = (p) => typeof p === 'string' && p.startsWith('/src/assets/uploads/') && existsSync(join(IMG_DIR, basename(p)));
const TW = /^TR\d{5,9}$/;
const PATH = /^$|^[a-z0-9-]+(\/[a-z0-9-]+)*$/;
const SECTION_TYPES = ['hero','text','imageText','services','featuredPrices','priceList','features','steps','reviews','faq','offers','team','gallery','treatwell','bookingBand','contact','blogList','visit','statement'];
const PRICE_GROUPS = readdirSync(join(C, 'prices')).filter((f) => f.endsWith('.yml')).map((f) => f.replace(/\.yml$/, ''));

function parse(file) {
  const raw = readFileSync(file, 'utf8');
  try {
    if (file.endsWith('.yml')) return { data: yaml.load(raw) ?? {}, body: '', raw };
    const m = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
    if (!m) { err(file, 'missing front matter (--- ... ---)'); return null; }
    return { data: yaml.load(m[1]) ?? {}, body: m[2], raw };
  } catch (e) { err(file, `YAML error: ${e.reason} at line ${(e.mark?.line ?? 0) + 1} (put text containing ": " in quotes)`); return null; }
}
function need(file, d, keys) { for (const k of keys) if (d[k] === undefined || d[k] === null || (d[k] === '' && k !== 'path')) err(file, `missing "${k}"`); }
function claims(file, text) {
  for (const re of BANNED) { const m = text.match(re); if (m) err(file, `wording not allowed (ASA/CAP or Treatwell rule): "${m[0]}"`); }
}

const checkers = {
  services(f, { data: d, body }) {
    need(f, d, ['title', 'path', 'navLabel', 'summary', 'image', 'imageAlt', 'order']);
    if (!PATH.test(d.path ?? '')) err(f, `bad path "${d.path}"`);
    if (!imgOk(d.image)) err(f, `image not found: ${d.image}`);
    if (d.treatwellServiceId && !TW.test(d.treatwellServiceId)) err(f, 'bad treatwellServiceId');
    for (const g of d.priceGroups ?? []) if (!PRICE_GROUPS.includes(g)) err(f, `unknown price group "${g}"`);
    if (!body.trim()) err(f, 'empty body');
  },
  pages(f, { data: d }) {
    need(f, d, ['title', 'path']);
    if (!PATH.test(d.path ?? 'x/')) err(f, `bad path "${d.path}"`);
    for (const [i, s] of (d.sections ?? []).entries()) {
      if (!SECTION_TYPES.includes(s.type)) err(f, `section ${i + 1}: unknown type "${s.type}"`);
      if (s.type === 'hero' && !s.title) err(f, `section ${i + 1}: hero needs a title`);
      if ((s.type === 'imageText') && (!imgOk(s.image) || !s.imageAlt || !s.body)) err(f, `section ${i + 1}: imageText needs body, image and imageAlt`);
      if (s.type === 'hero' && s.image && !imgOk(s.image)) err(f, `section ${i + 1}: image not found ${s.image}`);
      if ((s.type === 'features' || s.type === 'steps') && !(s.items?.length)) err(f, `section ${i + 1}: needs items`);
      if (s.type === 'text' && !s.body) err(f, `section ${i + 1}: text needs body`);
      if (s.type === 'priceList') for (const g of s.groups ?? []) if (!PRICE_GROUPS.includes(g)) err(f, `unknown price group "${g}"`);
      for (const c of [s.primary, s.secondary, s.cta]) if (c && (!c.label || !c.link)) err(f, `section ${i + 1}: link needs label and link`);
    }
  },
  blog(f, { data: d, body }) {
    need(f, d, ['title', 'path', 'date', 'image', 'imageAlt', 'excerpt']);
    if (!PATH.test(d.path ?? 'x/')) err(f, `bad path "${d.path}"`);
    if (!imgOk(d.image)) err(f, `image not found: ${d.image}`);
    if (body.trim().split(/\s+/).length < 300) err(f, 'post body shorter than 300 words');
  },
  faq(f, { data: d }) {
    need(f, d, ['question', 'answer', 'category', 'order']);
    if (!['general', 'sugaring', 'laser', 'booking', 'men'].includes(d.category)) err(f, `bad category "${d.category}"`);
  },
  reviews(f, { data: d }) {
    need(f, d, ['author', 'rating', 'text', 'date', 'source']);
    if (!['Google', 'Direct'].includes(d.source)) err(f, 'source must be Google or Direct (never copy Treatwell reviews)');
  },
  team(f, { data: d }) { need(f, d, ['name', 'role', 'order']); if (d.photo && !imgOk(d.photo)) err(f, `photo not found ${d.photo}`); },
  offers(f, { data: d }) { need(f, d, ['title', 'summary']); },
  prices() {},
  settings() {},
};

const targets = process.argv.slice(2).length
  ? process.argv.slice(2).map((p) => (p.startsWith('/') ? p : join(process.cwd(), p)))
  : Object.keys(checkers).flatMap((dir) => existsSync(join(C, dir)) ? readdirSync(join(C, dir)).filter((n) => /\.(md|yml)$/.test(n)).map((n) => join(C, dir, n)) : []);

const paths = new Map();
for (const f of targets) {
  const dir = relative(C, f).split('/')[0];
  const parsed = parse(f);
  if (!parsed) continue;
  checkers[dir]?.(f, parsed);
  if (!['prices', 'settings'].includes(dir)) claims(f, parsed.raw);
  const p = parsed.data?.path;
  if (typeof p === 'string') { if (paths.has(p)) err(f, `path "/${p}/" also used by ${paths.get(p)}`); paths.set(p, relative(ROOT, f)); }
}
if (errors.length) { console.error(errors.join('\n')); console.error(`\n${errors.length} problem(s)`); process.exit(1); }
console.log(`OK: ${targets.length} file(s) checked`);
