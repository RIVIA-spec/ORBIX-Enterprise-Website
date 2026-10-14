import {
  fallbackBrand,
  fallbackCollections,
  fallbackFooter,
  fallbackHeader,
  fallbackPages,
  fallbackTechnicalLinks,
} from './fallbacks';
import { publishedPagePaths } from '~/lib/content/page-builder';
import type {
  BrandSettings,
  CmsPage,
  LinkItem,
  MenuLink,
  NavigationGroup,
  Section,
  SeoFields,
  StrapiMedia,
} from './types';
import { safeCmsUrl } from '~/lib/content/sanitize';

const DEFAULT_TIMEOUT_MS = 8000;

const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL?.replace(/\/$/, '');
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN;
const FALLBACK_SETTING = import.meta.env.CMS_FALLBACK_ALLOWED?.trim().toLowerCase();

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeStrapiValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.filter((item) => item !== null && item !== undefined).map(normalizeStrapiValue);
  }

  if (!isObject(value)) return value;

  if ('data' in value && Object.keys(value).every((key) => key === 'data' || key === 'meta')) {
    return normalizeStrapiValue(value.data);
  }

  if (isObject(value.attributes)) {
    const attributes = normalizeStrapiValue(value.attributes) as Record<string, unknown>;
    return {
      ...attributes,
      ...(value.id !== undefined ? { id: value.id } : {}),
      ...(value.documentId !== undefined ? { documentId: value.documentId } : {}),
    };
  }

  return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, normalizeStrapiValue(nested)]));
};

const unwrap = <T>(payload: unknown): T | undefined => normalizeStrapiValue(payload) as T | undefined;

const redact = (message: string) => (STRAPI_API_TOKEN ? message.replaceAll(STRAPI_API_TOKEN, '[redacted]') : message);

export const hasStrapiConfig = Boolean(STRAPI_URL && STRAPI_API_TOKEN);

export function isCmsFallbackAllowed(requested = true): boolean {
  if (!requested || FALLBACK_SETTING === 'false' || FALLBACK_SETTING === '0' || FALLBACK_SETTING === 'no') {
    return false;
  }

  if (FALLBACK_SETTING === 'true' || FALLBACK_SETTING === '1' || FALLBACK_SETTING === 'yes') {
    return true;
  }

  return import.meta.env.DEV && !hasStrapiConfig;
}

export function mediaUrl(media?: StrapiMedia | null): string | undefined {
  if (!media?.url) return undefined;

  if (media.url.startsWith('http://') || media.url.startsWith('https://')) {
    return media.url;
  }

  if (media.url.startsWith('/uploads') && STRAPI_URL) {
    return `${STRAPI_URL}${media.url}`;
  }

  if (media.url.startsWith('/')) return media.url;

  return STRAPI_URL ? `${STRAPI_URL}/${media.url.replace(/^\/+/, '')}` : `/${media.url.replace(/^\/+/, '')}`;
}

async function strapiFetch<T>(path: string, init?: RequestInit): Promise<T | undefined> {
  if (!hasStrapiConfig) return undefined;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);
  const url = `${STRAPI_URL}/api/${path.replace(/^\/+/, '')}`;

  try {
    const response = await fetch(url, {
      ...init,
      cache: 'no-store',
      signal: controller.signal,
      headers: {
        'Cache-Control': 'no-store',
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
        Accept: 'application/json',
        ...(init?.headers || {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Strapi ${response.status} ${response.statusText} for ${path}`);
    }

    const payload = unwrap<T>(await response.json());
    return payload;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[strapi] ${redact(message)}.`);
    return undefined;
  } finally {
    clearTimeout(timeout);
  }
}

const safeBrandDefaults: BrandSettings = {
  brandName: 'Orbix',
  tagline: '',
  operatedBy: 'RIVIA',
  entityDefinition: '',
  riviaRelationship: '',
  colors: { ...fallbackBrand.colors },
  typography: { ...fallbackBrand.typography },
  assets: {},
  headerNavigation: [],
  footerNavigation: [],
  technicalLinks: [],
  socialProfiles: [],
};

export async function getBrandSettings(fallbackAllowed = true): Promise<BrandSettings> {
  const cmsBrand = await strapiFetch<BrandSettings>(
    [
      'brand-setting?',
      'populate[assets][populate][primaryHorizontalLogo]=true',
      '&populate[assets][populate][verticalLogo]=true',
      '&populate[assets][populate][symbolMark]=true',
      '&populate[assets][populate][lightLogo]=true',
      '&populate[assets][populate][darkLogo]=true',
      '&populate[assets][populate][favicon]=true',
      '&populate[assets][populate][defaultSocialImage]=true',
      '&populate[assets][populate][cityLandmarkPattern]=true',
      '&populate[assets][populate][cityLandmarkPatternOnBlue]=true',
      '&populate[assets][populate][circlePattern]=true',
      '&populate[assets][populate][lightPatternVariant]=true',
      '&populate[assets][populate][darkPatternVariant]=true',
      '&populate[assets][populate][orbixIconLibrary]=true',
      '&populate[assets][populate][brandIllustrations]=true',
      '&populate[assets][populate][visualIdentityPdf]=true',
      '&populate[assets][populate][mediaKitFiles]=true',
      '&populate[colors]=*',
      '&populate[typography]=*',
      '&populate[designOptions]=*',
      '&populate[headerNavigation][populate]=*',
      '&populate[footerNavigation][populate]=*',
      '&populate[technicalLinks]=*',
      '&populate[socialProfiles]=*',
      '&populate[defaultSeo][populate]=*',
      '&populate[headerSettings]=*',
      '&populate[footerSettings]=*',
      '&populate[geoEntities]=*',
    ].join('')
  );

  if (!cmsBrand) {
    if (isCmsFallbackAllowed(fallbackAllowed)) return fallbackBrand;
    throw new Error(
      'Required Strapi brand-setting content could not be loaded. Set CMS_FALLBACK_ALLOWED=true only for an intentional emergency build.'
    );
  }

  return {
    ...safeBrandDefaults,
    ...cmsBrand,
    assets: {
      ...(safeBrandDefaults.assets || {}),
      ...(cmsBrand?.assets || {}),
    },
    colors: {
      ...(cmsBrand?.colors || {}),
    },
    typography: {
      ...safeBrandDefaults.typography,
      ...(cmsBrand?.typography || {}),
    },
    headerNavigation: Array.isArray(cmsBrand.headerNavigation) ? cmsBrand.headerNavigation : [],
    footerNavigation: Array.isArray(cmsBrand.footerNavigation) ? cmsBrand.footerNavigation : [],
    technicalLinks: Array.isArray(cmsBrand.technicalLinks) ? cmsBrand.technicalLinks : [],
    socialProfiles: Array.isArray(cmsBrand.socialProfiles) ? cmsBrand.socialProfiles : [],
  };
}

interface HomepageRecord {
  heroLabel?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: StrapiMedia;
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: StrapiMedia;
  robots?: string;
  sections?: Section[];
  heroCarousel?: Array<Record<string, unknown>>;
}

export async function getHomepage(fallbackAllowed = true): Promise<CmsPage> {
  const [homepageBase, homepageDetails] = await Promise.all([
    strapiFetch<HomepageRecord>('homepage?populate=*'),
    strapiFetch<HomepageRecord>(
      'homepage?populate[heroCarousel][populate]=*&populate[sections][on][sections.generic-section][populate]=*'
    ),
  ]);
  const homepage = homepageBase
    ? {
        ...homepageBase,
        heroCarousel: homepageDetails?.heroCarousel || homepageBase.heroCarousel,
        sections: homepageDetails?.sections || homepageBase.sections,
      }
    : undefined;

  if (homepage) {
    const cmsSections = cleanSections(homepage.sections);
    const sections: Section[] = [];

    if (
      !cmsSections.some((section) => section.sectionType === 'hero') &&
      (homepage.heroTitle || homepage.heroSubtitle || homepage.heroImage)
    ) {
      sections.push({
        sectionType: 'hero',
        isVisible: true,
        eyebrow: homepage.heroLabel,
        title: homepage.heroTitle || 'Orbix',
        summary: homepage.heroSubtitle,
        media: homepage.heroImage ? [homepage.heroImage] : [],
        primaryCta:
          homepage.primaryCtaText || homepage.primaryCtaUrl
            ? {
                label: homepage.primaryCtaText,
                url: homepage.primaryCtaUrl,
              }
            : undefined,
        secondaryCta:
          homepage.secondaryCtaText || homepage.secondaryCtaUrl
            ? {
                label: homepage.secondaryCtaText,
                url: homepage.secondaryCtaUrl,
              }
            : undefined,
        patternSelection: 'city-landmark',
        themeVariant: 'dark',
      });
    }

    if (!cmsSections.some((section) => section.sectionType === 'carousel') && homepage.heroCarousel?.length) {
      sections.push({
        sectionType: 'carousel',
        isVisible: true,
        items: homepage.heroCarousel,
        themeVariant: 'dark',
      });
    }

    sections.push(...cmsSections);

    return {
      title: homepage.seoTitle || homepage.heroTitle || 'Orbix',
      slug: 'home',
      summary: homepage.seoDescription || homepage.heroSubtitle,
      sections,
      seo: {
        metaTitle: homepage.seoTitle,
        metaDescription: homepage.seoDescription,
        canonicalPath: homepage.canonicalUrl,
        noIndex: homepage.robots?.startsWith('noindex'),
        shareImage: homepage.ogImage,
      },
    };
  }

  if (isCmsFallbackAllowed(fallbackAllowed) && fallbackPages['/']) {
    return fallbackPages['/'];
  }

  throw new Error('Required Strapi homepage content was not found.');
}

const legacyNavigationRoutes: Record<string, string> = {
  '/services/real-estate': '/industries/real-estate',
  '/services/hospitality': '/industries/hospitality',
  '/services/offices': '/industries/offices',
};

function normalizeLegacyRoute(value: string): string {
  const match = value.match(/^([^?#]+)(.*)$/);

  if (!match) return value;

  const path = match[1].replace(/\/+$/, '') || '/';
  const suffix = match[2] || '';

  return `${legacyNavigationRoutes[path] || path}${suffix}`;
}

function normalizeLegacyNavigationRoutes<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeLegacyNavigationRoutes(item)) as T;
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(record).map(([key, item]) => [
        key,
        (key === 'url' || key === 'href') && typeof item === 'string'
          ? normalizeLegacyRoute(item)
          : normalizeLegacyNavigationRoutes(item),
      ])
    ) as T;
  }

  return value;
}
export async function getNavigation() {
  const brand = await getBrandSettings();
  const headerSettings = brand.headerSettings || {};
  const footerSettings = brand.footerSettings || {};
  const header = Array.isArray(brand.headerNavigation) ? brand.headerNavigation : fallbackHeader;
  const footerSource = Array.isArray(brand.footerNavigation) ? brand.footerNavigation : fallbackFooter;
  const footer =
    footerSettings.showTechnicalLinks === false
      ? footerSource.filter(
          (group) =>
            String(group.title || '')
              .trim()
              .toLowerCase() !== 'technical'
        )
      : footerSource;
  const technical =
    footerSettings.showTechnicalLinks === false
      ? []
      : Array.isArray(brand.technicalLinks)
        ? brand.technicalLinks
        : fallbackTechnicalLinks;

  return {
    brand,
    header: normalizeLegacyNavigationRoutes(header),
    footer: normalizeLegacyNavigationRoutes(footer),
    technical: normalizeLegacyNavigationRoutes(technical),
    social: Array.isArray(brand.socialProfiles) ? brand.socialProfiles : [],
    headerSettings,
    footerSettings,
  };
}

export async function getCmsPage(pathname: string, fallbackAllowed = true): Promise<CmsPage> {
  if (pathname === '/') {
    return getHomepage(fallbackAllowed);
  }

  const slug = pathname.replace(/^\/+|\/+$/g, '');
  const encoded = encodeURIComponent(slug);

  const pages = await strapiFetch<CmsPage[]>(
    'pages?status=published&populate[sections][on][sections.generic-section][populate]=*&populate[seo][populate]=*'
  );

  const page = Array.isArray(pages)
    ? pages.find((candidate) => {
        if (candidate.isVisible === false) return false;
        const candidatePath = String((candidate as CmsPage & { path?: string }).path || candidate.slug || '').replace(
          /^\/+|\/+$/g,
          ''
        );
        return candidatePath === slug || encodeURIComponent(candidatePath) === encoded;
      })
    : undefined;

  if (page) return normalizeCmsPage(page, pathname);

  if (Array.isArray(pages)) {
    return {
      title: slug.split('/').pop()?.replace(/-/g, ' ') || '',
      slug,
      sections: [],
    };
  }

  if (isCmsFallbackAllowed(fallbackAllowed)) {
    return (
      fallbackPages[pathname] || {
        title: pathname.split('/').filter(Boolean).pop()?.replace(/-/g, ' ') || 'Orbix',
        slug,
        summary: 'Orbix content is managed in Strapi. This fallback keeps static builds available.',
        sections: [],
      }
    );
  }

  throw new Error(`Required Strapi page content was not found for ${pathname}`);
}

export async function getPublishedPagePaths(fallbackAllowed = true): Promise<string[]> {
  const pages = await strapiFetch<
    Array<{ slug?: string; path?: string; publishedAt?: string; isVisible?: boolean; seo?: SeoFields }>
  >('pages?status=published&populate[seo][fields][0]=noIndex&pagination[pageSize]=100');
  if (Array.isArray(pages)) {
    return publishedPagePaths(pages);
  }
  if (isCmsFallbackAllowed(fallbackAllowed)) return [];
  throw new Error('Required Strapi published pages could not be loaded for sitemap generation.');
}

const sortableCollections = new Set(['banners', 'documents', 'faqs', 'guides', 'media-mentions', 'services']);

const collectionPath = (collection: string) => {
  if (collection === 'news') {
    return 'articles?status=published&filters[schemaType][$eq]=NewsArticle&populate=*&sort=publishedAt:desc';
  }

  const sort = sortableCollections.has(collection) ? 'sortOrder:asc' : 'publishedAt:desc';
  const populate =
    collection === 'virtual-tours'
      ? 'populate[panoramaScenes][populate]=*&populate[bookingCta]=*&populate[contactCta]=*&populate[seo][populate]=*'
      : 'populate=*';
  return `${collection}?status=published&${populate}&sort=${sort}`;
};

export async function getCollection<T>(collection: string, fallbackAllowed = true): Promise<T[]> {
  const items = await strapiFetch<Record<string, unknown>[]>(collectionPath(collection));

  if (Array.isArray(items)) {
    return items
      .filter((item): item is Record<string, unknown> => isObject(item))
      .map((item) => normalizeCmsPage(item, collection) as T);
  }

  if (isCmsFallbackAllowed(fallbackAllowed)) {
    return ((fallbackCollections[collection] || []) as T[]) ?? [];
  }

  throw new Error(`Required Strapi collection "${collection}" could not be loaded.`);
}

const navLink = (link: LinkItem): MenuLink | undefined => {
  const text = String(link.label || link.text || '').trim();
  const href = safeCmsUrl(link.url || link.href, '');
  if (!text || !href) return undefined;
  return { text, href, ariaLabel: link.ariaLabel, icon: link.icon, openInNewTab: link.openInNewTab };
};

export const toNavLinks = (groups: NavigationGroup[]): MenuLink[] =>
  groups.flatMap<MenuLink>((group) => {
    const links = (group.links || []).map(navLink).filter((link): link is MenuLink => Boolean(link));

    if (group.displayAsDropdown) {
      if (!links.length) return [];
      return [
        {
          text: String(group.title || 'Menu'),
          href: group.url || '#',
          links,
        },
      ];
    }

    const direct = navLink({ label: group.title, url: group.url });
    return direct ? [direct] : links;
  });

export const toFooterGroups = (groups: NavigationGroup[]) =>
  groups.map((group) => ({
    title: group.title,
    links: [
      ...(group.displayAsDropdown === false ? [navLink({ label: group.title, url: group.url })] : []),
      ...(group.links || []).map(navLink),
    ].filter((link): link is MenuLink => Boolean(link)),
  }));

function cleanSections(sections: Section[] | undefined): Section[] {
  if (!Array.isArray(sections)) return [];
  return sections.filter(
    (section): section is Section =>
      isObject(section) &&
      section.isVisible !== false &&
      typeof section.sectionType === 'string' &&
      section.sectionType.trim().length > 0
  );
}

function normalizeSeo(record: Record<string, unknown>): SeoFields {
  const nested = isObject(record.seo) ? record.seo : {};
  const robots = String(nested.robots || record.robots || '');
  return {
    ...nested,
    metaTitle: String(nested.metaTitle || record.seoTitle || record.ogTitle || ''),
    metaDescription: String(nested.metaDescription || record.seoDescription || record.ogDescription || ''),
    canonicalPath: String(nested.canonicalPath || nested.canonicalUrl || record.canonicalUrl || ''),
    robots,
    noIndex: nested.noIndex === true || robots.startsWith('noindex'),
    noFollow: nested.noFollow === true || robots.endsWith('nofollow'),
    shareImage: (nested.shareImage || nested.ogImage || record.ogImage || record.coverImage) as StrapiMedia | undefined,
    openGraphTitle: String(nested.openGraphTitle || record.ogTitle || ''),
    openGraphDescription: String(nested.openGraphDescription || record.ogDescription || ''),
    twitterTitle: String(nested.twitterTitle || record.twitterTitle || ''),
    twitterDescription: String(nested.twitterDescription || record.twitterDescription || ''),
    focusKeyword: String(nested.focusKeyword || record.focusKeyword || ''),
    secondaryKeywords: (nested.secondaryKeywords || record.secondaryKeywords) as string[] | undefined,
    aiSummary: String(nested.aiSummary || record.aiSummary || ''),
    answerSnippet: String(nested.answerSnippet || record.answerSnippet || ''),
    llmSummary: String(nested.llmSummary || record.llmSummary || ''),
    entityMentions: (nested.entityMentions || record.entityMentions) as unknown[] | undefined,
    geoTopics: (nested.geoTopics || record.geoTopics) as unknown[] | undefined,
    geoQuestions: (nested.geoQuestions || record.geoQuestions) as unknown[] | undefined,
  };
}

function normalizeCmsPage(record: CmsPage | Record<string, unknown>, pathname: string): CmsPage {
  const raw = record as Record<string, unknown>;
  const slug = String(raw.slug || pathname.replace(/^\/+|\/+$/g, ''));
  const sections = cleanSections(raw.sections as Section[] | undefined);
  const panoramaScenes = Array.isArray(raw.panoramaScenes) ? raw.panoramaScenes.filter((scene) => isObject(scene)) : [];
  if (!sections.length && pathname === 'virtual-tours' && panoramaScenes.length) {
    const coverImage = raw.coverImage as StrapiMedia | undefined;
    sections.push({
      sectionType: 'tour-viewer',
      title: String(raw.title || 'Virtual tour'),
      summary: String(raw.summary || ''),
      items: panoramaScenes.map((scene, index) => ({
        ...scene,
        ...(index === 0 && coverImage ? { poster: coverImage } : {}),
      })),
    });
  }
  return {
    ...(raw as unknown as CmsPage),
    title: String(raw.title || 'Orbix'),
    slug,
    summary: String(raw.summary || raw.excerpt || raw.seoDescription || ''),
    body: typeof raw.body === 'string' ? raw.body : undefined,
    sections,
    seo: normalizeSeo(raw),
  };
}
