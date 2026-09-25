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
