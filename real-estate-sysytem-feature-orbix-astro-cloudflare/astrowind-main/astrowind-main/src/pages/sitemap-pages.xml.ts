import { publicRoutes } from '~/lib/seo/routes';
import { getPublishedPagePaths } from '~/lib/strapi/client';
import { getCanonical } from '~/utils/permalinks';

const xmlEscape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const GET = async () => {
  const dynamicRoutes = await getPublishedPagePaths(false);
  const routes = [...new Set([...publicRoutes, ...dynamicRoutes])];
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${routes
      .map((route) => `  <url><loc>${xmlEscape(String(getCanonical(route)))}</loc></url>`)
      .join('\n')}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
