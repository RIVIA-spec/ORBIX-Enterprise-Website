import { getRssString } from '@astrojs/rss';

import { SITE, METADATA } from 'astrowind:config';
import { getCollection } from '~/lib/strapi/client';
import type { CmsPage } from '~/lib/strapi/types';
import { getCanonical } from '~/utils/permalinks';

export const GET = async () => {
  const articles = await getCollection<CmsPage>('articles');
  const items = articles
    .filter((item) => !item.seo?.noIndex)
    .map((item) => ({
      link: String(getCanonical(item.seo?.canonicalPath || `/${item.slug}`)),
      title: item.title,
      description: item.summary || '',
      pubDate: item.publishedAt
        ? new Date(item.publishedAt)
        : item.updatedAt
          ? new Date(item.updatedAt)
          : new Date('2026-09-03'),
    }));

  const rss = await getRssString({
    title: `${SITE.name} Articles and News`,
    description: METADATA?.description || '',
    site: import.meta.env.SITE,
    items,
    trailingSlash: SITE.trailingSlash,
  });

  return new Response(rss, { headers: { 'Content-Type': 'application/xml' } });
};
