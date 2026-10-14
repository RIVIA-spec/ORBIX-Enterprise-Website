import { getCollection } from '~/lib/strapi/client';
import type { CmsPage } from '~/lib/strapi/types';
import { getCanonical } from '~/utils/permalinks';

const xmlEscape = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export const GET = async () => {
  const articles = await getCollection<CmsPage>('articles');
  const posts = articles.filter((post) => !post.seo?.noIndex);

  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${posts
      .map(
        (post) =>
          `  <url><loc>${xmlEscape(String(getCanonical(post.seo?.canonicalPath || `/${post.slug}`)))}</loc>${
            post.updatedAt ? `<lastmod>${new Date(post.updatedAt).toISOString()}</lastmod>` : ''
          }</url>`
      )
      .join('\n')}\n</urlset>`,
    { headers: { 'Content-Type': 'application/xml; charset=utf-8' } }
  );
};
