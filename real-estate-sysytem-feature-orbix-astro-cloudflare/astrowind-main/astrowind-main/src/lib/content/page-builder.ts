import type { CallToAction } from '../../types';
import type { BrandSettings, LinkItem, Section, StrapiMedia } from '../strapi/types.ts';
import { escapeCmsText, safeCmsUrl } from './sanitize.ts';

type MediaResolver = (media?: StrapiMedia | null) => string | undefined;

const buttonVariantByStyle: Record<string, CallToAction['variant']> = {
  primary: 'primary',
  secondary: 'secondary',
  outline: 'secondary',
  text: 'link',
  store: 'secondary',
};

export function cmsActionFromLink(
  cta?: LinkItem,
  fallbackVariant: CallToAction['variant'] = 'primary'
): CallToAction | undefined {
  const href = safeCmsUrl(cta?.url || cta?.href, '');
  const text = escapeCmsText(cta?.label || cta?.text);

  if (!href || !text) return undefined;

  const style = String(cta?.style || '').trim();

  return {
    variant: buttonVariantByStyle[style] || fallbackVariant,
    text,
    href,
    icon: cta?.icon,
    target: cta?.openInNewTab ? '_blank' : undefined,
  };
}

export function safeContentItemHref(item: Record<string, unknown>): string | undefined {
  return safeCmsUrl(typeof item.url === 'string' ? item.url : undefined, '') || undefined;
}

const safeBadgeUrl = (badge: StrapiMedia | undefined, resolveMediaUrl: MediaResolver) => {
  const url = safeCmsUrl(resolveMediaUrl(badge), '');
  return url || undefined;
};

export function appStoreLinks(
  section: Section,
  brand: BrandSettings,
  resolveMediaUrl: MediaResolver
): Array<{ key: 'apple' | 'googlePlay'; label: string; href: string; badgeUrl?: string; badgeAlt: string }> {
  const appleHref = safeCmsUrl(section.appleUrl || brand.appStoreUrl, '');
  const googlePlayHref = safeCmsUrl(section.googlePlayUrl || brand.googlePlayUrl, '');

  return [
    {
      key: 'apple' as const,
      label: 'App Store',
      href: section.showApple === false ? '' : appleHref,
      badgeUrl: safeBadgeUrl(section.appleBadge, resolveMediaUrl),
      badgeAlt: 'Download on the App Store',
    },
    {
      key: 'googlePlay' as const,
      label: 'Google Play',
      href: section.showGooglePlay === false ? '' : googlePlayHref,
      badgeUrl: safeBadgeUrl(section.googlePlayBadge, resolveMediaUrl),
      badgeAlt: 'Get it on Google Play',
    },
  ].filter((link) => Boolean(link.href));
}

export function publishedPagePaths(
  pages: Array<{ slug?: string; path?: string; isVisible?: boolean; seo?: { noIndex?: boolean } }>
): string[] {
  return pages
    .filter((page) => page.isVisible !== false && page.seo?.noIndex !== true)
    .map((page) => String(page.path || page.slug || '').trim())
    .filter(Boolean)
    .map((slug) => `/${slug.replace(/^\/+/, '')}`);
}
