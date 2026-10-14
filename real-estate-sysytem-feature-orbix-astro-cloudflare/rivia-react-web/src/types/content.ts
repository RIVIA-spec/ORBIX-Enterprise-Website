export type CmsSeo = {
  metaTitle: string;
  metaDescription: string;
  canonicalPath?: string;
  noIndex?: boolean;
  shareImage?: CmsMedia | null;
};

export type CmsMedia = {
  id?: number;
  documentId?: string;
  url: string;
  alternativeText?: string;
  caption?: string;
  width?: number;
  height?: number;
  mime?: string;
  name?: string;
};

export type CmsLink = {
  label: string;
  url: string;
};

export type CmsArticle = {
  id?: number;
  documentId?: string;
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  articleType?: 'article' | 'city-guide' | 'partner-guide' | 'photography-guide';
  category?: string;
  coverImage?: CmsMedia | null;
  publishedAt?: string;
  seo?: CmsSeo;
};

export type CmsService = {
  id?: number;
  documentId?: string;
  title: string;
  slug: string;
  summary: string;
  body: string;
  icon?: string;
  sortOrder?: number;
  seo?: CmsSeo;
};

export type CmsPageContent = {
  id?: number;
  documentId?: string;
  title: string;
  slug: string;
  summary?: string;
  body: string;
  seo?: CmsSeo;
};

export type CmsBanner = {
  id?: number;
  documentId?: string;
  title: string;
  subtitle?: string;
  badge?: string;
  placement?: 'homepage-hero' | 'homepage-inline' | 'articles' | 'services' | 'guides' | 'global';
  image?: CmsMedia | null;
  imageUrl?: string;
  linkLabel?: string;
  linkUrl?: string;
  sortOrder?: number;
  isActive?: boolean;
};

export type CmsGuide = {
  id?: number;
  documentId?: string;
  title: string;
  slug: string;
  guideType?: 'city' | 'buyer' | 'renter' | 'partner' | 'photography' | 'investment' | 'general';
  summary: string;
  body: string;
  coverImage?: CmsMedia | null;
  city?: string;
  sortOrder?: number;
  featured?: boolean;
  seo?: CmsSeo;
};

export type CmsFaq = {
  id?: number;
  documentId?: string;
  question: string;
  slug: string;
  answer: string;
  category?: string;
  sortOrder?: number;
  isActive?: boolean;
  seo?: CmsSeo;
};

export type CmsMediaMention = {
  id?: number;
  documentId?: string;
  title: string;
  slug: string;
  publisher: string;
  summary?: string;
  url: string;
  publishedOn?: string;
  logo?: CmsMedia | null;
  sortOrder?: number;
  isFeatured?: boolean;
};

export type CmsDocument = {
  id?: number;
  documentId?: string;
  title: string;
  slug: string;
  description?: string;
  documentType?: 'download' | 'brochure' | 'form' | 'media-kit' | 'policy' | 'other';
  file?: CmsMedia | null;
  thumbnail?: CmsMedia | null;
  sortOrder?: number;
  isPublic?: boolean;
};

export type CmsHomepage = {
  id?: number;
  documentId?: string;
  heroLabel?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroImage?: CmsMedia | null;
  heroCarousel?: CmsBanner[];
  primaryCtaText?: string;
  primaryCtaUrl?: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
  featuredArticleSlugs?: string[];
  featuredGuideSlugs?: string[];
  featuredServiceSlugs?: string[];
  googlePlayUrl?: string;
  appStoreUrl?: string;
  appLinksTitle?: string;
  appLinksDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  structuredDataOverride?: Record<string, unknown>;
};

export type CmsSiteSettings = {
  id?: number;
  documentId?: string;
  siteName?: string;
  siteUrl?: string;
  tagline?: string;
  defaultSeoTitle?: string;
  defaultSeoDescription?: string;
  defaultOgImage?: CmsMedia | null;
  siteLogo?: CmsMedia | null;
  brandPrimaryColor?: string;
  brandSecondaryColor?: string;
  brandAccentColor?: string;
  brandBackgroundColor?: string;
  brandSurfaceColor?: string;
  brandTextColor?: string;
  brandMutedTextColor?: string;
  brandColors?: Record<string, string>;
  socialLinks?: CmsLink[] | Record<string, string>;
  footerDescription?: string;
  footerColumns?: Array<{ title: string; links: CmsLink[] }>;
  footerLegalLinks?: CmsLink[];
  googlePlayUrl?: string;
  appStoreUrl?: string;
  appLinks?: CmsLink[] | Record<string, string>;
  mediaKitUrl?: string;
  organizationSchemaOverride?: Record<string, unknown>;
  websiteSchemaOverride?: Record<string, unknown>;
};
