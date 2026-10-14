import type { BrandSettings, CmsPage } from '~/lib/strapi/types';
import { mediaUrl } from '~/lib/strapi/client';

type JsonLd = Record<string, unknown>;

export function safeJsonLd(data: JsonLd | JsonLd[]) {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function organizationSchema(brand: BrandSettings, site: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: brand.operatedBy || 'RIVIA',
    url: site,
    brand: {
      '@type': 'Brand',
      name: brand.brandName,
      slogan: brand.tagline,
      description: brand.entityDefinition,
    },
  };
}

export function websiteSchema(brand: BrandSettings, site: string): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: brand.brandName,
    url: site,
    publisher: { '@type': 'Organization', name: brand.operatedBy || 'RIVIA' },
  };
}

export function webpageSchema(page: CmsPage, url: string, brand: BrandSettings): JsonLd {
  const allowedTypes = new Set([
    'Article',
    'BlogPosting',
    'NewsArticle',
    'CreativeWork',
    'CollectionPage',
    'ProfilePage',
    'Report',
    'DefinedTerm',
    'Service',
    'DigitalDocument',
    'WebPage',
  ]);
  const pathname = new URL(url).pathname;
  const requestedType = allowedTypes.has(page.schemaType || '') ? page.schemaType : undefined;
  const schemaType =
    requestedType ||
    (pathname.startsWith('/services/')
      ? 'Service'
      : pathname.startsWith('/articles/')
        ? 'Article'
        : pathname.startsWith('/news/')
          ? 'NewsArticle'
          : pathname.startsWith('/downloads/')
            ? 'DigitalDocument'
            : 'WebPage');
  return {
    '@context': 'https://schema.org',
    '@type': schemaType,
    name: page.title,
    description: page.summary,
    url,
    isPartOf: { '@type': 'WebSite', name: brand.brandName },
    publisher: { '@type': 'Organization', name: brand.operatedBy || 'RIVIA' },
    datePublished: page.publishedAt,
    dateModified: page.updatedAt,
    image: mediaUrl(page.seo?.shareImage),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
