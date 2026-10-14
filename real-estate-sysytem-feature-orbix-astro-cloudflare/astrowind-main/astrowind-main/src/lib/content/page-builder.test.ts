import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { appStoreLinks, cmsActionFromLink, publishedPagePaths, safeContentItemHref } from './page-builder.ts';
import type { BrandSettings, Section, StrapiMedia } from '../strapi/types.ts';

const brand: BrandSettings = {
  brandName: 'Orbix',
  tagline: '',
  operatedBy: 'RIVIA',
  entityDefinition: '',
  riviaRelationship: '',
  colors: {},
  typography: {
    englishFont: 'IBM Plex Sans',
    arabicFont: 'IBM Plex Sans Arabic',
    codeFont: 'IBM Plex Mono',
  },
  appStoreUrl: 'https://apps.apple.com/app/orbix',
  googlePlayUrl: 'https://play.google.com/store/apps/details?id=orbix',
};

const mediaUrl = (media?: StrapiMedia | null) => media?.url;

describe('page builder content safety', () => {
  it('keeps safe internal links', () => {
    assert.equal(cmsActionFromLink({ label: 'Join', url: '/partners/join' })?.href, '/partners/join');
    assert.equal(safeContentItemHref({ url: '/services' }), '/services');
  });

  it('keeps safe external https links', () => {
    assert.equal(cmsActionFromLink({ label: 'Open', url: 'https://orbix.test' })?.href, 'https://orbix.test');
  });

  it('maps CMS link styles to supported button variants', () => {
    assert.equal(cmsActionFromLink({ label: 'More', url: '/more', style: 'text' })?.variant, 'link');
    assert.equal(cmsActionFromLink({ label: 'Store', url: '/app', style: 'store' })?.variant, 'secondary');
  });

  it('falls back to the requested CTA variant for unknown styles', () => {
    assert.equal(
      cmsActionFromLink({ label: 'More', url: '/more', style: 'ghost' } as never, 'secondary')?.variant,
      'secondary'
    );
  });

  it('rejects javascript and data urls', () => {
    assert.equal(cmsActionFromLink({ label: 'Bad', url: 'javascript:alert(1)' }), undefined);
    assert.equal(safeContentItemHref({ url: 'data:text/html,hello' }), undefined);
  });

  it('rejects unsafe content item URLs', () => {
    assert.equal(safeContentItemHref({ url: 'vbscript:msgbox(1)' }), undefined);
  });

  it('does not render a CTA without a link', () => {
    assert.equal(cmsActionFromLink({ label: 'Missing', url: '' }), undefined);
  });

  it('uses text fallbacks or hides app badges safely', () => {
    const links = appStoreLinks({ sectionType: 'app-store-links' } as Section, brand, mediaUrl);

    assert.equal(links.length, 2);
    assert.equal(links[0].badgeUrl, undefined);
    assert.equal(links[0].label, 'App Store');
  });

  it('uses section app store URLs before brand defaults', () => {
    const links = appStoreLinks(
      {
        sectionType: 'app-store-links',
        appleUrl: 'https://apps.apple.com/app/orbix-section',
        googlePlayUrl: 'https://play.google.com/store/apps/details?id=orbix.section',
      } as Section,
      brand,
      mediaUrl
    );

    assert.equal(links[0].href, 'https://apps.apple.com/app/orbix-section');
    assert.equal(links[1].href, 'https://play.google.com/store/apps/details?id=orbix.section');
  });

  it('hides disabled app store badges', () => {
    const links = appStoreLinks(
      { sectionType: 'app-store-links', showApple: false, showGooglePlay: false } as Section,
      brand,
      mediaUrl
    );

    assert.deepEqual(links, []);
  });

  it('excludes invisible pages from generated paths', () => {
    assert.deepEqual(publishedPagePaths([{ path: 'visible' }, { path: 'hidden', isVisible: false }]), ['/visible']);
  });

  it('excludes noindex pages from generated paths', () => {
    assert.deepEqual(publishedPagePaths([{ path: 'visible' }, { path: 'private', seo: { noIndex: true } }]), [
      '/visible',
    ]);
  });

  it('keeps nested paths for static generation', () => {
    assert.deepEqual(publishedPagePaths([{ path: 'partners/join' }]), ['/partners/join']);
  });
});
