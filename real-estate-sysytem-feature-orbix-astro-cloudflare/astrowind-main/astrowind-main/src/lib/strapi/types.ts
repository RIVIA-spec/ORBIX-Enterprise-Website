export interface HeaderSettings {
  isVisible?: boolean;
  isSticky?: boolean;
  style?: 'light' | 'dark';
  menuPosition?: 'left' | 'center' | 'right';
  logoVariant?: 'full' | 'mark';
  isFullWidth?: boolean;
  showThemeToggle?: boolean;
  showRssFeed?: boolean;
  showContactButton?: boolean;
  contactButtonText?: string;
  contactButtonUrl?: string;
}

export interface FooterSettings {
  isVisible?: boolean;
  showTechnicalLinks?: boolean;
  showSocialLinks?: boolean;
  copyrightText?: string;
}
export interface StrapiMedia {
  name?: string;
  mime?: string;
  url?: string;
  alternativeText?: string;
  width?: number;
  height?: number;
  formats?: Record<string, { url?: string; width?: number; height?: number }>;
}

export interface BrandColors {
  primaryBlue?: string;
  secondaryLightBlue?: string;
  white?: string;
  navy?: string;
  mainDarkBackground?: string;
  elevatedSurface?: string;
  primaryText?: string;
  mutedText?: string;
  borderColor?: string;
  pageBackground?: string;
  headingColor?: string;
  accentColor?: string;
  interactionColor?: string;
  sourceNotes?: string;
}

export interface BrandAssets {
  primaryHorizontalLogo?: StrapiMedia;
  verticalLogo?: StrapiMedia;
  symbolMark?: StrapiMedia;
  lightLogo?: StrapiMedia;
  darkLogo?: StrapiMedia;
  logoLight?: StrapiMedia;
  logoDark?: StrapiMedia;
  logoMark?: StrapiMedia;
  favicon?: StrapiMedia;
  defaultSocialImage?: StrapiMedia;
  cityLandmarkPattern?: StrapiMedia;
  cityLandmarkPatternOnBlue?: StrapiMedia;
  circlePattern?: StrapiMedia;
  lightPatternVariant?: StrapiMedia;
  darkPatternVariant?: StrapiMedia;
  orbixIconLibrary?: StrapiMedia[];
  brandIllustrations?: StrapiMedia[];
  visualIdentityPdf?: StrapiMedia;
  mediaKitFiles?: StrapiMedia[];
  [key: string]: StrapiMedia | StrapiMedia[] | undefined;
}

export interface BrandSettings {
  brandName: string;
  tagline: string;
  operatedBy: string;
  entityDefinition: string;
  riviaRelationship: string;
  assets?: BrandAssets;
  colors: BrandColors;
  typography: {
    englishFont: string;
    arabicFont: string;
    codeFont: string;
    headingWeights?: number[];
    bodyWeights?: number[];
    baseTextSize?: string;
    lineHeight?: string;
    letterSpacing?: string;
  };
  designOptions?: Record<string, string>;
  headerSettings?: HeaderSettings;
  footerSettings?: FooterSettings;
  headerNavigation?: NavigationGroup[];
  footerNavigation?: NavigationGroup[];
  technicalLinks?: LinkItem[];
  socialProfiles?: LinkItem[];
  appStoreUrl?: string;
  googlePlayUrl?: string;
  llmsDescription?: string;
  defaultSeo?: SeoFields;
  geoEntities?: Array<Record<string, unknown>>;
}

export interface LinkItem {
  label?: string;
  text?: string;
  url?: string;
  href?: string;
  style?: 'primary' | 'secondary' | 'outline' | 'text' | 'store';
  ariaLabel?: string;
  icon?: string;
  openInNewTab?: boolean;
}

export interface NavigationGroup {
  title?: string;
  url?: string;
  displayAsDropdown?: boolean;
  links?: LinkItem[];
}

export interface Section {
  __component?: string;
  sectionType?: string;
  isVisible?: boolean;
  isRequired?: boolean;
  eyebrow?: string;
  title?: string;
  summary?: string;
  body?: string;
  media?: StrapiMedia[];
  items?: Array<Record<string, unknown>>;
  colors?: Record<string, unknown>;
  separator?: 'none' | 'line' | 'dot';
  speed?: number;
  direction?: 'ltr' | 'rtl';
  pauseOnHover?: boolean;
  mobileBehavior?: 'scroll' | 'static' | 'stack';
  ariaLabel?: string;
  backgroundColorToken?: string;
  textColorToken?: string;
  watermark?: StrapiMedia;
  contentItems?: Array<{
    id?: number;
    isVisible?: boolean;
    label?: string;
    title?: string;
    summary?: string;
    description?: string;
    url?: string;
    icon?: string;
    iconData?: { name?: string; key?: string; asset?: StrapiMedia; alternativeText?: string; category?: string };
    iconMedia?: StrapiMedia;
    badge?: string;
    image?: StrapiMedia;
    sortOrder?: number;
    openInNewTab?: boolean;
    iconSource?: 'library' | 'upload';
    customIcon?: StrapiMedia;
    iconSize?: 'small' | 'medium' | 'large';
    iconColor?: 'blue' | 'white' | 'navy' | 'muted';
    animationPreset?: 'none' | 'fade' | 'slide' | 'scale' | 'static' | 'marquee';
    animationDelay?: number;
    hoverEffect?: 'none' | 'lift' | 'glow' | 'border';
    [key: string]: unknown;
  }>;
  anchorId?: string;
  alignment?: 'start' | 'center' | 'end';
  containerWidth?: 'narrow' | 'standard' | 'wide' | 'full';
  spacingTop?: 'none' | 'small' | 'medium' | 'large';
  spacingBottom?: 'none' | 'small' | 'medium' | 'large';
  primaryCta?: LinkItem;
  secondaryCta?: LinkItem;
  themeVariant?: 'light' | 'dark' | 'blue' | 'white';
  appleUrl?: string;
  googlePlayUrl?: string;
  appleBadge?: StrapiMedia;
  googlePlayBadge?: StrapiMedia;
  showApple?: boolean;
  showGooglePlay?: boolean;
  patternSelection?: string;
  iconSelection?: string;
  customPattern?: StrapiMedia;
  patternPosition?: 'top' | 'center' | 'bottom' | 'full';
  patternOpacity?: 'none' | 'subtle' | 'medium' | 'strong';
  animationPreset?: 'none' | 'fade' | 'slide' | 'scale' | 'static' | 'marquee';
  staggerItems?: boolean;
  cardStyle?: 'flat' | 'outlined' | 'elevated' | 'glass';
  columnsDesktop?: 'two' | 'three' | 'four';
  columnsMobile?: 'one' | 'two';
}

export interface CmsPage {
  title: string;
  slug: string;
  path?: string;
  isVisible?: boolean;
  articleType?: string;
  summary?: string;
  body?: string;
  sections?: Section[];
  seo?: SeoFields;
  schemaType?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  aiSummary?: string;
  answerSnippet?: string;
  llmSummary?: string;
  entityMentions?: unknown[];
  geoTopics?: unknown[];
  geoQuestions?: unknown[];
  structuredDataOverride?: Record<string, unknown>;
  publishedAt?: string;
  updatedAt?: string;
}

export interface SeoFields {
  metaTitle?: string;
  metaDescription?: string;
  canonicalPath?: string;
  canonicalUrl?: string;
  robots?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  shareImage?: StrapiMedia;
  openGraphTitle?: string;
  openGraphDescription?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  focusKeyword?: string;
  secondaryKeywords?: string[];
  aiSummary?: string;
  answerSnippet?: string;
  llmSummary?: string;
  entityMentions?: unknown[];
  geoTopics?: unknown[];
  geoQuestions?: unknown[];
}

export interface MenuLink {
  text: string;
  href?: string;
  ariaLabel?: string;
  icon?: string;
  openInNewTab?: boolean;
  links?: MenuLink[];
}
