import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Images are stored by Pages CMS as "/src/assets/uploads/<file>" and resolved in src/lib/images.ts.
const imagePath = z.string().regex(/^\/src\/assets\/uploads\/[^/]+\.(jpe?g|png|webp|avif)$/i, 'Image must be in /src/assets/uploads/');
const optionalText = z.string().optional().nullable().transform((v) => v || undefined);
// Paths are written without leading/trailing slash; "" is the homepage.
const sitePath = z.string().regex(/^$|^[a-z0-9-]+(\/[a-z0-9-]+)*$/, 'Use lowercase words separated by hyphens, e.g. first-visit');
const treatwellId = z.string().regex(/^TR\d{5,9}$/, 'Treatwell ID looks like TR4725291').optional().nullable().transform((v) => v || undefined);

const seo = z.object({
  title: optionalText,
  description: optionalText,
  image: imagePath.optional().nullable().transform((v) => v || undefined),
  noindex: z.boolean().optional().default(false),
}).optional().default({ noindex: false });

const cta = z.object({ label: z.string(), link: z.string() }).optional().nullable().transform((v) => v || undefined);
const titled = { title: optionalText, eyebrow: optionalText, intro: optionalText };

// Page sections (Pages CMS "block" field, blockKey: type)
const section = z.discriminatedUnion('type', [
  z.object({ type: z.literal('hero'), eyebrow: optionalText, title: z.string(), text: optionalText, image: imagePath.optional().nullable(), imageAlt: optionalText, primary: cta, secondary: cta, showTrust: z.boolean().optional().default(true) }),
  z.object({ type: z.literal('text'), ...titled, body: z.string() }),
  z.object({ type: z.literal('imageText'), ...titled, body: z.string(), image: imagePath, imageAlt: z.string(), imageSide: z.enum(['left', 'right']).optional().default('right'), cta }),
  z.object({ type: z.literal('services'), ...titled }),
  z.object({ type: z.literal('featuredPrices'), ...titled, cta }),
  z.object({ type: z.literal('priceList'), ...titled, groups: z.array(z.string()).optional().default([]) }),
  z.object({ type: z.literal('features'), ...titled, items: z.array(z.object({ title: z.string(), text: z.string() })) }),
  z.object({ type: z.literal('steps'), ...titled, items: z.array(z.object({ title: z.string(), text: z.string() })), cta }),
  z.object({ type: z.literal('reviews'), ...titled, limit: z.number().int().min(1).max(12).optional().default(6) }),
  z.object({ type: z.literal('faq'), ...titled, category: z.enum(['all', 'general', 'sugaring', 'laser', 'booking', 'men']).optional().default('all'), limit: z.number().int().optional() }),
  z.object({ type: z.literal('offers'), ...titled }),
  z.object({ type: z.literal('team'), ...titled }),
  z.object({ type: z.literal('gallery'), ...titled, images: z.array(z.object({ image: imagePath, alt: z.string() })) }),
  z.object({ type: z.literal('treatwell'), ...titled }),
  z.object({ type: z.literal('bookingBand'), ...titled }),
  z.object({ type: z.literal('contact'), ...titled, showForm: z.boolean().optional().default(true) }),
  z.object({ type: z.literal('blogList'), ...titled }),
  z.object({ type: z.literal('visit'), ...titled }),
]);

const site = defineCollection({
  loader: glob({ pattern: 'site.yml', base: './src/content/settings' }),
  schema: z.object({
    name: z.string(),
    tagline: z.string(),
    description: z.string(),
    phone: z.string(),
    phoneDisplay: z.string(),
    whatsapp: z.string().regex(/^\d{10,15}$/, 'WhatsApp number in international format, digits only, e.g. 447840820525'),
    email: z.string().email(),
    address: z.object({ building: z.string(), street: z.string(), city: z.string(), postcode: z.string() }),
    geo: z.object({ lat: z.number(), lng: z.number() }),
    mapsUrl: z.string().url(),
    social: z.object({ instagram: optionalText, facebook: optionalText, tiktok: optionalText }),
    treatwell: z.object({
      widgetUrl: z.string().url().refine((u) => u.startsWith('https://widget.treatwell.co.uk/'), 'Use the widget link (widget.treatwell.co.uk), never the marketplace page'),
      rating: z.number().min(0).max(5),
      reviewCount: z.number().int(),
      asOf: z.string(),
    }),
    languages: z.array(z.string()),
    announcement: z.object({ active: z.boolean().default(false), text: optionalText, link: optionalText }).optional(),
    seo: z.object({ title: z.string(), description: z.string(), image: imagePath }),
  }),
});

const hours = defineCollection({
  loader: glob({ pattern: 'hours.yml', base: './src/content/settings' }),
  schema: z.object({
    weekly: z.array(z.object({
      day: z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']),
      open: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
      close: z.string().regex(/^\d{2}:\d{2}$/).optional().nullable(),
      closed: z.boolean().optional().default(false),
    })).length(7),
    exceptions: z.array(z.object({
      date: z.coerce.date(),
      label: z.string(),
      closed: z.boolean().optional().default(true),
      open: optionalText,
      close: optionalText,
    })).optional().default([]),
  }),
});

const prices = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/prices' }),
  schema: z.object({
    title: z.string(),
    category: z.enum(['sugaring-packages', 'sugaring-body', 'sugaring-face', 'mens-sugaring', 'laser', 'consultation']),
    order: z.number(),
    treatwellServiceId: treatwellId,
    note: optionalText,
    items: z.array(z.object({
      name: z.string(),
      minutes: z.number().int().positive().optional().nullable(),
      price: z.number().min(0),
      free: z.boolean().optional().default(false),
      from: z.boolean().optional().default(false),
      featured: z.boolean().optional().default(false),
      note: optionalText,
    })).min(1),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    path: sitePath,
    navLabel: z.string(),
    summary: z.string(),
    image: imagePath,
    imageAlt: z.string(),
    order: z.number(),
    treatwellServiceId: treatwellId,
    priceGroups: z.array(z.string()).optional().default([]),
    fromPrice: z.number().optional().nullable().transform((v) => v ?? undefined),
    whoFor: optionalText,
    steps: z.array(z.object({ title: z.string(), text: z.string() })).optional().default([]),
    feel: optionalText,
    prep: z.array(z.string()).optional().default([]),
    aftercare: z.array(z.string()).optional().default([]),
    faqCategory: z.enum(['general', 'sugaring', 'laser', 'booking', 'men']).optional(),
    seo,
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/pages' }),
  schema: z.object({
    title: z.string(),
    path: sitePath,
    seo,
    sections: z.array(section).optional().default([]),
  }),
});

const blog = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    path: sitePath,
    date: z.coerce.date(),
    updated: z.coerce.date().optional().nullable(),
    author: optionalText,
    image: imagePath,
    imageAlt: z.string(),
    excerpt: z.string(),
    draft: z.boolean().optional().default(false),
    seo,
  }),
});

const reviews = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/reviews' }),
  schema: z.object({
    author: z.string(),
    rating: z.number().int().min(1).max(5),
    text: z.string(),
    date: z.coerce.date(),
    source: z.enum(['Google', 'Direct']),
    service: optionalText,
  }),
});

const faq = defineCollection({
  loader: glob({ pattern: '*.yml', base: './src/content/faq' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.enum(['general', 'sugaring', 'laser', 'booking', 'men']),
    order: z.number(),
  }),
});

const team = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/team' }),
  schema: z.object({
    name: z.string(),
    role: z.string(),
    photo: imagePath.optional().nullable().transform((v) => v || undefined),
    photoAlt: optionalText,
    languages: z.array(z.string()).optional().default([]),
    order: z.number(),
  }),
});

const offers = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/offers' }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    price: z.number().optional().nullable(),
    image: imagePath.optional().nullable().transform((v) => v || undefined),
    imageAlt: optionalText,
    validFrom: z.coerce.date().optional().nullable(),
    validTo: z.coerce.date().optional().nullable(),
    closedGroup: z.boolean().optional().default(false),
    treatwellServiceId: treatwellId,
    terms: optionalText,
    active: z.boolean().optional().default(true),
    order: z.number().optional().default(0),
  }),
});

export const collections = { site, hours, prices, services, pages, blog, reviews, faq, team, offers };
