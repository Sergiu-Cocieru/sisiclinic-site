import type { ImageMetadata } from 'astro';

// Pages CMS stores images as "/src/assets/uploads/<file>". Vite's glob keys use the same form,
// so a stored path maps straight to the optimisable image.
const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/uploads/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}', { eager: true });

export function resolveImage(path?: string | null): ImageMetadata | undefined {
  if (!path) return undefined;
  const hit = files[path];
  if (!hit) throw new Error(`Image not found: ${path}. Upload it through the CMS into /src/assets/uploads/.`);
  return hit.default;
}
