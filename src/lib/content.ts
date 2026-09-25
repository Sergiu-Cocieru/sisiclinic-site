import { getCollection, getEntry } from 'astro:content';
import { marked } from 'marked';

export async function getSite() {
  const e = await getEntry('site', 'site');
  if (!e) throw new Error('Missing src/content/settings/site.yml');
  return e.data;
}

export async function getHours() {
  const e = await getEntry('hours', 'hours');
  if (!e) throw new Error('Missing src/content/settings/hours.yml');
  return e.data;
}

export async function getPriceGroups() {
  return (await getCollection('prices')).sort((a, b) => a.data.order - b.data.order);
}

export async function getServices() {
  return (await getCollection('services')).sort((a, b) => a.data.order - b.data.order);
}

export async function getReviews() {
  return (await getCollection('reviews')).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export async function getFaqs(category?: string) {
  const all = (await getCollection('faq')).sort((a, b) => a.data.order - b.data.order);
  return category && category !== 'all' ? all.filter((f) => f.data.category === category) : all;
}

export async function getTeam() {
  return (await getCollection('team')).sort((a, b) => a.data.order - b.data.order);
}

export async function getActiveOffers(now = new Date()) {
  return (await getCollection('offers'))
    .filter((o) => o.data.active)
    .filter((o) => (!o.data.validFrom || o.data.validFrom <= now) && (!o.data.validTo || o.data.validTo >= now))
    .sort((a, b) => a.data.order - b.data.order);
}

export async function getPosts() {
  return (await getCollection('blog', (p) => !p.data.draft)).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export function md(text?: string): string {
  return text ? (marked.parse(text, { async: false }) as string) : '';
}

export function money(n: number): string {
  return Number.isInteger(n) ? `£${n}` : `£${n.toFixed(2)}`;
}

export function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// *word* in a CMS title becomes the one italic accent; everything else is escaped.
export function accent(text?: string | null): string {
  if (!text) return '';
  const esc = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return esc.replace(/\*([^*]+)\*/g, '<em>$1</em>');
}

// Lowest non-free price across the given groups (or all groups): "from £10" is always computed, never typed.
export async function minPrice(groupIds?: string[]): Promise<number | undefined> {
  const groups = await getPriceGroups();
  const use = groupIds?.length ? groups.filter((g) => groupIds.includes(g.id)) : groups;
  const prices = use.flatMap((g) => g.data.items.filter((i) => !i.free).map((i) => i.price));
  return prices.length ? Math.min(...prices) : undefined;
}

// A review shown at display size works as the studio's own claim (CAP 3.45): the large slot skips comparative wording.
const COMPARATIVE = /pain[- ]?free|painless|less painful|no pain|permanent|gentler|better than wax|100%/i;
export function leadReview<T extends { data: { text: string } }>(list: T[]): T | undefined {
  return list.find((r) => !COMPARATIVE.test(r.data.text)) ?? list[0];
}

export function waLink(number: string, text?: string): string {
  return `https://wa.me/${number}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}
