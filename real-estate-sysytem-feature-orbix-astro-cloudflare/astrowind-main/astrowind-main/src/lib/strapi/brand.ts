import type { BrandSettings, StrapiMedia } from './types';

type MediaResolver = (media?: StrapiMedia | null) => string | undefined;

type AssetValue = StrapiMedia | StrapiMedia[] | undefined;

export interface ResolvedBrandAssets {
  logoLight?: string;
  logoDark?: string;
  logoMark?: string;
  favicon?: string;
  cityLandmarkPattern?: string;
  cityLandmarkPatternOnBlue?: string;
  circlePattern?: string;
  lightPatternVariant?: string;
  darkPatternVariant?: string;
  orbixIconLibrary: StrapiMedia[];
}

export interface ResolvedBrandTokens {
  primaryBlue: string;
  blueLight: string;
  navy: string;
  dark: string;
  surface: string;
  surfaceSoft: string;
  pageBackground: string;
  headingColor: string;
  bodyTextColor: string;
  mutedTextColor: string;
  borderColor: string;
  white: string;
  interaction: string;
  darkBodyText: string;
  darkMutedText: string;
}

export interface ResolvedBrandTypography {
  arabicFont: string;
  englishFont: string;
  codeFont: string;
  baseTextSize: string;
  lineHeight: string;
}

export interface ResolvedBrandSettings {
  tokens: ResolvedBrandTokens;
  typography: ResolvedBrandTypography;
  assets: ResolvedBrandAssets;
}

const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i;
const LOCAL_PATTERN_BLUE = '/orbix/brand/patterns/city-landmarks-blue.png';
const LOCAL_PATTERN_ON_BLUE = '/orbix/brand/patterns/city-landmarks-white-on-blue.png';

export const defaultBrandTokens: ResolvedBrandTokens = {
  primaryBlue: '#0874ff',
  blueLight: '#79b5ff',
  navy: '#061d3d',
  dark: '#030621',
  surface: '#ffffff',
  surfaceSoft: '#eef5ff',
  pageBackground: '#ffffff',
  headingColor: '#083d77',
  bodyTextColor: '#0a315f',
  mutedTextColor: '#60758f',
  borderColor: '#d7e5f5',
  white: '#ffffff',
  interaction: '#0874ff',
  darkBodyText: '#eef5ff',
  darkMutedText: '#a9bad0',
};

const defaultTypography: ResolvedBrandTypography = {
  arabicFont: 'IBM Plex Sans Arabic',
  englishFont: 'IBM Plex Sans',
  codeFont: 'IBM Plex Mono',
  baseTextSize: '16px',
  lineHeight: '1.6',
};

const allowedFonts = new Set(['IBM Plex Sans', 'IBM Plex Sans Arabic', 'IBM Plex Mono']);
const allowedTextSizes = new Set(['14px', '15px', '16px', '17px', '18px']);

const singleAsset = (asset: AssetValue): StrapiMedia | undefined => (Array.isArray(asset) ? asset[0] : asset);

const warn = (message: string) => {
  if (import.meta.env?.DEV || import.meta.env?.PROD) console.warn(message);
};

export const isSafeHexColor = (value: unknown): value is string =>
  typeof value === 'string' && HEX_COLOR.test(value.trim());

const normalizeHexColor = (value: unknown, fallback: string, token: string): string => {
  if (value === undefined || value === null || value === '') return fallback;
  if (isSafeHexColor(value)) return value.trim();
  warn(`[brand] Ignored invalid color token "${token}".`);
  return fallback;
};

const parseHex = (value: string): [number, number, number] => {
  const hex = value.slice(1);
  if (hex.length === 3 || hex.length === 4) {
    return [0, 1, 2].map((index) => parseInt(hex[index] + hex[index], 16)) as [number, number, number];
  }
  return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
};

const luminance = (value: string): number => {
  const rgb = parseHex(value).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
};

const contrastRatio = (foreground: string, background: string): number => {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
};

const enforceContrast = (
  foreground: string,
  background: string,
  fallback: string,
  token: string,
  minimum = 4.5
): string => {
  if (foreground.toLowerCase() === background.toLowerCase() || contrastRatio(foreground, background) < minimum) {
    warn(`[brand] Ignored "${token}" because it does not meet readable contrast.`);
    return fallback;
  }
  return foreground;
};

const fontFamily = (value: unknown, fallback: string): string =>
  typeof value === 'string' && allowedFonts.has(value.trim()) ? value.trim() : fallback;

const fontCssValue = (value: string) => `'${value}'`;

const mediaToUrl = (asset: AssetValue, resolveMediaUrl: MediaResolver): string | undefined => {
  const resolved = resolveMediaUrl(singleAsset(asset));
  if (!resolved) return undefined;
  const value = resolved.trim();
  if (!value) return undefined;

  if (value.startsWith('/')) return value;

  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:' ? value : undefined;
  } catch {
    return undefined;
  }
};

export function normalizeBrandSettings(
  brand: Partial<BrandSettings> = {},
  resolveMediaUrl: MediaResolver = (media) => media?.url
): ResolvedBrandSettings {
  const isGeneratedLocalFallback =
    brand.colors?.primaryBlue === '#016AFA' &&
    brand.colors?.secondaryLightBlue === '#69A8FE' &&
    brand.colors?.sourceNotes?.includes('approved values');
  const colors = isGeneratedLocalFallback ? {} : brand.colors || {};
  const typography = brand.typography || ({} as Partial<BrandSettings['typography']>);
  const assets = brand.assets || {};

  const pageBackground = normalizeHexColor(colors.pageBackground, defaultBrandTokens.pageBackground, 'pageBackground');
  const bodyTextColor = normalizeHexColor(colors.primaryText, defaultBrandTokens.bodyTextColor, 'primaryText');
  const headingColor = normalizeHexColor(colors.headingColor, defaultBrandTokens.headingColor, 'headingColor');
  const mutedTextColor = normalizeHexColor(colors.mutedText, defaultBrandTokens.mutedTextColor, 'mutedText');

  const tokens: ResolvedBrandTokens = {
    primaryBlue: normalizeHexColor(colors.primaryBlue, defaultBrandTokens.primaryBlue, 'primaryBlue'),
    blueLight: normalizeHexColor(colors.secondaryLightBlue, defaultBrandTokens.blueLight, 'secondaryLightBlue'),
    navy: normalizeHexColor(colors.navy, defaultBrandTokens.navy, 'navy'),
    dark: normalizeHexColor(colors.mainDarkBackground, defaultBrandTokens.dark, 'mainDarkBackground'),
    surface: normalizeHexColor(colors.elevatedSurface, defaultBrandTokens.surface, 'elevatedSurface'),
    surfaceSoft: defaultBrandTokens.surfaceSoft,
    pageBackground,
    headingColor: enforceContrast(headingColor, pageBackground, defaultBrandTokens.headingColor, 'headingColor'),
    bodyTextColor: enforceContrast(bodyTextColor, pageBackground, defaultBrandTokens.bodyTextColor, 'primaryText'),
    mutedTextColor: enforceContrast(mutedTextColor, pageBackground, defaultBrandTokens.mutedTextColor, 'mutedText', 3),
    borderColor: normalizeHexColor(colors.borderColor, defaultBrandTokens.borderColor, 'borderColor'),
    white: normalizeHexColor(colors.white, defaultBrandTokens.white, 'white'),
    interaction: normalizeHexColor(colors.interactionColor, defaultBrandTokens.interaction, 'interactionColor'),
    darkBodyText: defaultBrandTokens.darkBodyText,
    darkMutedText: defaultBrandTokens.darkMutedText,
  };

  const lineHeight = Number(typography.lineHeight);

  return {
    tokens,
    typography: {
      arabicFont: fontCssValue(fontFamily(typography.arabicFont, defaultTypography.arabicFont)),
      englishFont: fontCssValue(fontFamily(typography.englishFont, defaultTypography.englishFont)),
      codeFont: fontCssValue(fontFamily(typography.codeFont, defaultTypography.codeFont)),
      baseTextSize:
        typeof typography.baseTextSize === 'string' && allowedTextSizes.has(typography.baseTextSize)
          ? typography.baseTextSize
          : defaultTypography.baseTextSize,
      lineHeight: lineHeight >= 1 && lineHeight <= 2 ? String(lineHeight) : defaultTypography.lineHeight,
    },
    assets: {
      logoLight: mediaToUrl(assets.logoLight || assets.lightLogo || assets.primaryHorizontalLogo, resolveMediaUrl),
      logoDark: mediaToUrl(assets.logoDark || assets.darkLogo || assets.primaryHorizontalLogo, resolveMediaUrl),
      logoMark: mediaToUrl(assets.logoMark || assets.symbolMark || assets.primaryHorizontalLogo, resolveMediaUrl),
      favicon: mediaToUrl(assets.favicon, resolveMediaUrl),
      cityLandmarkPattern: mediaToUrl(assets.cityLandmarkPattern, resolveMediaUrl),
      cityLandmarkPatternOnBlue:
        mediaToUrl(assets.cityLandmarkPatternOnBlue, resolveMediaUrl) ||
        mediaToUrl(assets.lightPatternVariant, resolveMediaUrl),
      circlePattern: mediaToUrl(assets.circlePattern, resolveMediaUrl),
      lightPatternVariant: mediaToUrl(assets.lightPatternVariant, resolveMediaUrl),
      darkPatternVariant: mediaToUrl(assets.darkPatternVariant, resolveMediaUrl),
      orbixIconLibrary: Array.isArray(assets.orbixIconLibrary) ? assets.orbixIconLibrary : [],
    },
  };
}

export const localPatternFallback = (variant?: string): string =>
  variant === 'light' || variant === 'dark' ? LOCAL_PATTERN_ON_BLUE : LOCAL_PATTERN_BLUE;
