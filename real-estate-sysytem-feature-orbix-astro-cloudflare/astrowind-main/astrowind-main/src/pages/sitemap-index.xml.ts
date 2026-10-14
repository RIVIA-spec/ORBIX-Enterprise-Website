import { getCanonical } from '~/utils/permalinks';

export const GET = async () =>
  new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <sitemap><loc>${getCanonical('/sitemap-pages.xml')}</loc></sitemap>\n  <sitemap><loc>${getCanonical('/sitemap-articles.xml')}</loc></sitemap>\n</sitemapindex>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
