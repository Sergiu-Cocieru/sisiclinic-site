// All internal links go through href() so the preview (GitHub Pages) and the live site share one build logic.
const BASE = import.meta.env.BASE_URL.endsWith('/') ? import.meta.env.BASE_URL : import.meta.env.BASE_URL + '/';

export function href(path: string): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const [p, hash] = path.split('#');
  const clean = p.replace(/^\/+|\/+$/g, '');
  return BASE + (clean ? clean + '/' : '') + (hash ? '#' + hash : '');
}

export function asset(path: string): string {
  return BASE + path.replace(/^\/+/, '');
}

// Treatwell widget link. serviceIds opens the right group (undocumented; falls back to the full menu).
export function treatwellUrl(widgetUrl: string, serviceId?: string): string {
  return serviceId ? `${widgetUrl}?serviceIds=${encodeURIComponent(serviceId)}` : widgetUrl;
}

export const isPreview = import.meta.env.PUBLIC_PREVIEW === '1';
