// Developer-only. Old WordPress URLs and what happens to them.
// Used to generate .htaccess and by scripts/check-site.mjs.
// Paths are written without the leading and trailing slash.

// The 15 URLs that were indexed on the old site. They must all exist in the new build.
export const LEGACY_URLS = [
  '',
  'sugaring-hair-removal',
  'sugaring-hair-removal-manchester-clinic',
  'sugaring-prices-manchester',
  'offer-sugaring-hair-removal-service',
  'black-friday-laser-hair-removal-sugaring-offers',
  'book-an-appointment',
  'contact',
  'blog',
  'sugar-waxing-a-history',
  'is-sugaring-the-same-as-waxing',
  'sugaring-hair-removal-ingrown-hairs',
  'privacy-policy',
  'terms-conditions',
];

// 301: old path -> new path
export const REDIRECTS_301 = [
  ['sugaring-hair-removal-manchester-clinic-2', 'sugaring-hair-removal-manchester-clinic'],
  ['about', 'sugaring-hair-removal-manchester-clinic'],
  ['about-us', 'sugaring-hair-removal-manchester-clinic'],
  ['sugaring-hair-removal-manchester', ''],
  ['home', ''],
  ['customer-cabinet', 'book-an-appointment'],
  ['pricing', 'sugaring-prices-manchester'],
  ['contact-us', 'contact'],
  ['sugaring', 'sugaring-hair-removal'],
  ['sugaring-copy', 'sugaring-hair-removal'],
  ['sugaring-waxing-manchester', 'sugaring-hair-removal'],
  ['laser', 'laser-hair-removal'],
  ['laser-hair-removal-how-it-works-and-its-benefits', 'laser-hair-removal'],
  ['the-aftercare-of-laser-hair-removal-dos-and-donts', 'aftercare'],
  ['offer-hair-removal-service', 'offer-sugaring-hair-removal-service'],
  ['category/uncategorized', 'blog'],
];

// 410 Gone: old WordPress and plugin paths (prefix match)
export const GONE_PREFIXES = [
  'wp-admin', 'wp-includes', 'wp-json', 'wp-content', 'elementor-hf', 'author', 'feed', 'comments/feed',
];
// 410 Gone: exact files
export const GONE_FILES = [
  'wp-login.php', 'xmlrpc.php', 'readme.html', 'license.txt', 'wp-cron.php', 'wp-config.php',
  'romethemeform_form-sitemap.xml', 'romethemeform_entry-sitemap.xml', 'elementor-hf-sitemap.xml', 'category-sitemap.xml',
];
// 410 Gone: query-string junk on any path
export const GONE_QUERY_KEYS = ['romethemeform_entry', 'romethemeform_form'];

// Old Yoast/WordPress sitemaps -> the new sitemap index
export const SITEMAP_REDIRECTS = ['sitemap_index.xml', 'wp-sitemap.xml', 'page-sitemap.xml', 'post-sitemap.xml'];
