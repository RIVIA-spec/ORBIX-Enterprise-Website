import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { defaultBrandTokens, normalizeBrandSettings } from './brand.ts';
import type { BrandSettings, StrapiMedia } from './types.ts';

const baseBrand = (overrides: Partial<BrandSettings> = {}): BrandSettings => ({
  brandName: 'Orbix',
  tagline: 'Reality Reimagined',
  operatedBy: 'RIVIA',
  entityDefinition: '',
  riviaRelationship: '',
  colors: {},
  typography: {
    englishFont: 'IBM Plex Sans',
    arabicFont: 'IBM Plex Sans Arabic',
    codeFont: 'IBM Plex Mono',
  },
  assets: {},
  ...overrides,
});

const resolveMedia = (media?: StrapiMedia | null) => media?.url;

describe('normalizeBrandSettings', () => {
  it('uses current local identity when all fields are empty', () => {
    const resolved = normalizeBrandSettings(baseBrand(), resolveMedia);

    assert.deepEqual(resolved.tokens, defaultBrandTokens);
    assert.equal(resolved.assets.logoLight, undefined);
    assert.equal(resolved.assets.favicon, undefined);
  });

  it('changes only the valid color token provided by CMS', () => {
    const resolved = normalizeBrandSettings(
      baseBrand({ colors: { primaryBlue: '#123abc', mutedText: '' } }),
      resolveMedia
    );

    assert.equal(resolved.tokens.primaryBlue, '#123abc');
    assert.equal(resolved.tokens.mutedTextColor, defaultBrandTokens.mutedTextColor);
    assert.equal(resolved.tokens.headingColor, defaultBrandTokens.headingColor);
  });

  it('falls back only the invalid color token', () => {
    const resolved = normalizeBrandSettings(
      baseBrand({ colors: { primaryBlue: 'url(javascript:bad)', secondaryLightBlue: '#abcdef' } }),
      resolveMedia
    );

    assert.equal(resolved.tokens.primaryBlue, defaultBrandTokens.primaryBlue);
    assert.equal(resolved.tokens.blueLight, '#abcdef');
  });

  it('maps logo assets from the existing Strapi field names', () => {
    const resolved = normalizeBrandSettings(
      baseBrand({
        assets: {
          lightLogo: { url: 'https://cms.test/uploads/light.png' },
          darkLogo: { url: 'https://cms.test/uploads/dark.png' },
          symbolMark: { url: 'https://cms.test/uploads/mark.png' },
        },
      }),
      resolveMedia
    );

    assert.equal(resolved.assets.logoLight, 'https://cms.test/uploads/light.png');
    assert.equal(resolved.assets.logoDark, 'https://cms.test/uploads/dark.png');
    assert.equal(resolved.assets.logoMark, 'https://cms.test/uploads/mark.png');
  });

  it('keeps missing favicon and pattern assets undefined for local fallbacks', () => {
    const resolved = normalizeBrandSettings(baseBrand(), resolveMedia);

    assert.equal(resolved.assets.favicon, undefined);
    assert.equal(resolved.assets.cityLandmarkPattern, undefined);
  });

  it('rejects empty and malformed media URLs', () => {
    const resolved = normalizeBrandSettings(
      baseBrand({
        assets: {
          lightLogo: { url: '' },
          darkLogo: { url: 'javascript:alert(1)' },
          favicon: { url: 'favicon.png' },
        },
      }),
      resolveMedia
    );

    assert.equal(resolved.assets.logoLight, undefined);
    assert.equal(resolved.assets.logoDark, undefined);
    assert.equal(resolved.assets.favicon, undefined);
  });
});
