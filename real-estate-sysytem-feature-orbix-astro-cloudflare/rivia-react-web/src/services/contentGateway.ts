import type {
  CmsArticle,
  CmsBanner,
  CmsDocument,
  CmsFaq,
  CmsGuide,
  CmsHomepage,
  CmsMedia,
  CmsMediaMention,
  CmsPageContent,
  CmsService,
  CmsSiteSettings,
} from '../types/content';

const STRAPI_URL = String(import.meta.env.VITE_STRAPI_URL || '').replace(/\/$/, '');
const REQUEST_TIMEOUT_MS = 8_000;

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || '').trim()).filter(Boolean) : [];
}

function absoluteStrapiUrl(url?: unknown): string {
  const value = String(url || '').trim();
  if (!value) return '';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  return STRAPI_URL ? `${STRAPI_URL}${value.startsWith('/') ? value : `/${value}`}` : value;
}

export function normalizeStrapiDocument<T>(value: unknown): T {
  if (!isRecord(value)) return value as T;
  const attributes = isRecord(value.attributes) ? value.attributes : value;
  const normalized: UnknownRecord = {
    ...attributes,
    ...(value.id != null ? { id: value.id } : {}),
    ...(value.documentId != null ? { documentId: value.documentId } : {}),
  };

  Object.entries(normalized).forEach(([key, item]) => {
    if (isRecord(item) && 'data' in item) {
      normalized[key] = Array.isArray(item.data)
        ? item.data.map((entry) => normalizeStrapiDocument(entry))
        : normalizeStrapiDocument(item.data);
    }
  });

  return normalized as T;
}

export function normalizeStrapiCollection<T>(payload: unknown): T[] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) return [];
  return payload.data.map((item) => normalizeStrapiDocument<T>(item));
}

export function normalizeStrapiSingle<T>(payload: unknown): T | null {
  if (!isRecord(payload) || payload.data == null) return null;
  return normalizeStrapiDocument<T>(payload.data);
}

function normalizeMedia(value: unknown): CmsMedia | null {
  if (!value) return null;
  const media = normalizeStrapiDocument<CmsMedia>(value);
  if (!media || !media.url) return null;
  return { ...media, url: absoluteStrapiUrl(media.url) };
}

function normalizeSeo<T extends { seo?: unknown }>(item: T): T {
  if (!isRecord(item.seo)) return item;
  return {
    ...item,
    seo: {
      ...item.seo,
      shareImage: normalizeMedia((item.seo as UnknownRecord).shareImage),
    },
  };
}

function normalizeContentMedia<T extends UnknownRecord>(item: T): T {
  return {
    ...item,
    coverImage: normalizeMedia(item.coverImage),
    heroImage: normalizeMedia(item.heroImage),
    image: normalizeMedia(item.image),
    logo: normalizeMedia(item.logo),
    file: normalizeMedia(item.file),
    thumbnail: normalizeMedia(item.thumbnail),
    defaultOgImage: normalizeMedia(item.defaultOgImage),
    siteLogo: normalizeMedia(item.siteLogo),
  };
}

function mapContent<T>(item: T): T {
  if (!isRecord(item)) return item;
  return normalizeSeo(normalizeContentMedia(item));
}

async function requestJson(path: string): Promise<unknown> {
  if (!STRAPI_URL) return [];
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const response = await fetch(STRAPI_URL + path, {
    headers: { Accept: 'application/json' },
    signal: controller.signal,
  }).finally(() => window.clearTimeout(timeoutId));
  if (!response.ok) throw new Error('Strapi request failed with status ' + response.status);
  return response.json();
}

async function requestCollection<T>(path: string): Promise<T[]> {
  if (!STRAPI_URL) return [];
  return normalizeStrapiCollection<T>(await requestJson(path)).map((item) => mapContent(item));
}

async function requestSingle<T>(path: string): Promise<T | null> {
  if (!STRAPI_URL) return null;
  const item = normalizeStrapiSingle<T>(await requestJson(path));
  return item ? mapContent(item) : null;
}

function slugFilter(slug: string): string {
  return '?filters[slug][$eq]=' + encodeURIComponent(slug) + '&populate=*&pagination[pageSize]=1';
}

function activeFilter(path: string, field = 'isActive'): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}filters[${field}][$eq]=true`;
}

export function isCmsConfigured(): boolean {
  return Boolean(STRAPI_URL);
}

export async function getHomepage(): Promise<CmsHomepage | null> {
  const homepage = await requestSingle<CmsHomepage>('/api/homepage?populate[heroImage]=true&populate[heroCarousel][populate]=image');
  if (!homepage) return null;
  return {
    ...homepage,
    heroCarousel: (homepage.heroCarousel || []).map((banner) => normalizeBanner(banner)),
    featuredArticleSlugs: asStringArray(homepage.featuredArticleSlugs),
    featuredGuideSlugs: asStringArray(homepage.featuredGuideSlugs),
    featuredServiceSlugs: asStringArray(homepage.featuredServiceSlugs),
  };
}

export function getSiteSettings(): Promise<CmsSiteSettings | null> {
  return requestSingle<CmsSiteSettings>('/api/site-setting?populate=*');
}

export function listArticles(): Promise<CmsArticle[]> {
  return requestCollection<CmsArticle>('/api/articles?sort=publishedAt:desc&populate=*');
}

export async function getArticleBySlug(slug: string): Promise<CmsArticle | null> {
  return (await requestCollection<CmsArticle>('/api/articles' + slugFilter(slug)))[0] || null;
}

export function listArticlesByType(articleType: NonNullable<CmsArticle['articleType']>): Promise<CmsArticle[]> {
  return requestCollection<CmsArticle>(
    '/api/articles?sort=publishedAt:desc&populate=*&filters[articleType][$eq]=' + encodeURIComponent(articleType),
  );
}

export function listServices(): Promise<CmsService[]> {
  return requestCollection<CmsService>('/api/services?sort=sortOrder:asc&populate=*');
}

export async function getServiceBySlug(slug: string): Promise<CmsService | null> {
  return (await requestCollection<CmsService>('/api/services' + slugFilter(slug)))[0] || null;
}

export async function getPageBySlug(slug: string): Promise<CmsPageContent | null> {
  return (await requestCollection<CmsPageContent>('/api/pages' + slugFilter(slug)))[0] || null;
}

function normalizeBanner(banner: CmsBanner): CmsBanner {
  return {
    ...banner,
    image: normalizeMedia(banner.image),
    imageUrl: banner.imageUrl || banner.image?.url || '',
  };
}

export async function listBanners(placement?: CmsBanner['placement']): Promise<CmsBanner[]> {
  const filters = [
    'sort=sortOrder:asc',
    'populate=*',
    'filters[isActive][$eq]=true',
    placement ? 'filters[placement][$eq]=' + encodeURIComponent(placement) : '',
  ].filter(Boolean);
  return (await requestCollection<CmsBanner>('/api/banners?' + filters.join('&'))).map(normalizeBanner);
}

export function listHomepageBanners(): Promise<CmsBanner[]> {
  return listBanners('homepage-hero');
}

export function listGuides(): Promise<CmsGuide[]> {
  return requestCollection<CmsGuide>('/api/guides?sort=sortOrder:asc&populate=*');
}

export async function getGuideBySlug(slug: string): Promise<CmsGuide | null> {
  return (await requestCollection<CmsGuide>('/api/guides' + slugFilter(slug)))[0] || null;
}

export function listFaqs(): Promise<CmsFaq[]> {
  return requestCollection<CmsFaq>(activeFilter('/api/faqs?sort=sortOrder:asc&populate=*'));
}

export function listMediaMentions(): Promise<CmsMediaMention[]> {
  return requestCollection<CmsMediaMention>('/api/media-mentions?sort=sortOrder:asc,publishedOn:desc&populate=*');
}

export function listDocuments(): Promise<CmsDocument[]> {
  return requestCollection<CmsDocument>('/api/documents?sort=sortOrder:asc&populate=*&filters[isPublic][$eq]=true');
}
